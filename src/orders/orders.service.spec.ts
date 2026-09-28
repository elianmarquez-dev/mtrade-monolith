import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

describe('OrdersService', () => {
  let service: OrdersService;
  let productOwners: Map<string, string>;
  let createOrder: jest.Mock;

  beforeEach(async () => {
    const orders = new Map<string, any>();
    productOwners = new Map<string, string>();
    createOrder = jest.fn(async ({ data }) => {
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
    });
    const prismaMock = {
      product: {
        findMany: jest.fn(async ({ where }: any) =>
          where.id.in
            .filter((productId: string) => productOwners.get(productId) === where.ownerId)
            .map((id: string) => ({ id })),
        ),
      },
      order: {
        create: createOrder,
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

  it('should reject an order containing a product owned by the customer', async () => {
    productOwners.set('owned-product', 'user-1');

    await expect(
      service.create({
        userId: 'user-1',
        items: [{ productId: 'owned-product', quantity: 1, unitPrice: 20 }],
      }),
    ).rejects.toThrow('You cannot order your own products');

    expect(createOrder).not.toHaveBeenCalled();
  });

  it('should reject adding a product owned by the customer to an existing order', async () => {
    const order = await service.create({
      userId: 'user-1',
      items: [{ productId: 'other-product', quantity: 1, unitPrice: 20 }],
    });
    productOwners.set('owned-product', 'user-1');

    await expect(
      service.update(order.id, 'user-1', {
        items: [{ productId: 'owned-product', quantity: 1, unitPrice: 20 }],
      }),
    ).rejects.toThrow('You cannot order your own products');
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
