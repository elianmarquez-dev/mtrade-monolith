import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const orders = new Map<string, any>();
    const prismaMock = {
      order: {
        create: jest.fn(async ({ data }) => {
          const now = new Date();
          const order = {
            id: randomUUID(),
            userId: data.userId,
            status: 'PENDING',
            totalAmount: new Prisma.Decimal(data.totalAmount),
            createdAt: now,
            updatedAt: now,
            items: data.items.create.map((item: any) => ({
              id: randomUUID(),
              ...item,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              createdAt: now,
            })),
          };
          orders.set(order.id, order);
          return order;
        }),
        findMany: jest.fn(async ({ where }: any) =>
          [...orders.values()].filter((order) => order.userId === where.userId),
        ),
        findFirst: jest.fn(async ({ where }: any) => {
          const order = orders.get(where.id);
          return order?.userId === where.userId ? order : null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const order = orders.get(where.id);
          if (!order || order.userId !== where.userId) {
            throw new NotFoundException('Order not found');
          }
          if (data.status) order.status = data.status;
          if (data.totalAmount !== undefined) {
            order.totalAmount = new Prisma.Decimal(data.totalAmount);
          }
          if (data.items) {
            order.items = data.items.create.map((item: any) => ({
              id: randomUUID(),
              ...item,
              unitPrice: new Prisma.Decimal(item.unitPrice),
              createdAt: new Date(),
            }));
          }
          return order;
        }),
        deleteMany: jest.fn(async ({ where }: any) => {
          const order = orders.get(where.id);
          if (!order || order.userId !== where.userId) return { count: 0 };
          orders.delete(where.id);
          return { count: 1 };
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an order and calculate its total', async () => {
    const order = await service.create({
      userId: 'user-1',
      items: [
        { productId: 'product-1', quantity: 2, unitPrice: 15 },
        { productId: 'product-2', quantity: 1, unitPrice: 10 },
      ],
    });

    expect(order).toMatchObject({
      userId: 'user-1',
      status: 'PENDING',
      totalAmount: 40,
    });
    expect(order.id).toBeDefined();
  });

  it('should only return orders owned by the requested user', async () => {
    const order = await service.create({
      userId: 'user-1',
      items: [{ productId: 'product-1', quantity: 1, unitPrice: 20 }],
    });
    await service.create({
      userId: 'user-2',
      items: [{ productId: 'product-2', quantity: 1, unitPrice: 30 }],
    });

    expect(await service.findAll('user-1')).toEqual([order]);
    await expect(service.findOne(order.id, 'user-2')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update and remove an owned order', async () => {
    const order = await service.create({
      userId: 'user-1',
      items: [{ productId: 'product-1', quantity: 1, unitPrice: 20 }],
    });

    const updated = await service.update(order.id, 'user-1', {
      status: 'CONFIRMED',
      items: [{ productId: 'product-1', quantity: 2, unitPrice: 20 }],
    });

    expect(updated).toMatchObject({ status: 'CONFIRMED', totalAmount: 40 });
    expect(await service.remove(order.id, 'user-1')).toEqual({
      success: true,
      orderId: order.id,
    });
    await expect(service.findOne(order.id, 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should reject invalid order data', async () => {
    await expect(
      service.create({
        userId: 'user-1',
        items: [],
      }),
    ).rejects.toThrow(BadRequestException);

    const order = await service.create({
      userId: 'user-1',
      items: [{ productId: 'product-1', quantity: 1, unitPrice: 20 }],
    });

    await expect(
      service.update(order.id, 'user-1', { status: 'SHIPPED' }),
    ).rejects.toThrow(BadRequestException);
  });
});
