import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(async () => {
    const payments = new Map<string, any>();
    const prismaMock = {
      $transaction: jest.fn(async (callback) =>
        callback({
          payment: {
            findUnique: jest.fn(async ({ where }) =>
              [...payments.values()].find(
                (payment) => payment.idempotencyKey === where.idempotencyKey,
              ) ?? null,
            ),
            create: jest.fn(async ({ data }) => {
              const now = new Date();
              const payment = {
                id: randomUUID(),
                orderId: data.orderId,
                userId: data.userId,
                amount: new Prisma.Decimal(data.amount),
                status: 'PENDING',
                provider: data.provider ?? null,
                providerPaymentId: null,
                idempotencyKey: data.idempotencyKey,
                createdAt: now,
                updatedAt: now,
              };
              payments.set(payment.id, payment);
              return payment;
            }),
          },
          order: {
            findFirst: jest.fn(async () => ({ id: 'order-1' })),
          },
        }),
      ),
      payment: {
        findUnique: jest.fn(async ({ where }) =>
          [...payments.values()].find(
            (payment) => payment.idempotencyKey === where.idempotencyKey,
          ) ?? null,
        ),
        findMany: jest.fn(async ({ where }) =>
          [...payments.values()].filter(
            (payment) => payment.userId === where.userId,
          ),
        ),
        findFirst: jest.fn(async ({ where }) => {
          const payment = payments.get(where.id);
          return payment?.userId === where.userId ? payment : null;
        }),
        update: jest.fn(async ({ where, data }) => {
          const payment = payments.get(where.id);
          payment.status = data.status;
          payment.updatedAt = new Date();
          return payment;
        }),
        delete: jest.fn(async ({ where }) => {
          const payment = payments.get(where.id);
          payments.delete(where.id);
          return payment;
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the same payment for a repeated idempotent request', async () => {
    const payload = {
      userId: 'user-1',
      orderId: 'order-1',
      amount: 49.99,
      provider: 'stripe',
    };
    const first = await service.createIdempotent(payload, 'payment-key-000001');
    const repeated = await service.createIdempotent(payload, 'payment-key-000001');

    expect(repeated).toEqual(first);
    expect(await service.findAll('user-1')).toHaveLength(1);
    expect(first.status).toBe('PENDING');
  });

  it('should reject reuse of an idempotency key with another payload', async () => {
    await service.createIdempotent(
      { userId: 'user-1', orderId: 'order-1', amount: 20 },
      'payment-key-000002',
    );

    await expect(
      service.createIdempotent(
        { userId: 'user-1', orderId: 'order-1', amount: 21 },
        'payment-key-000002',
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('should enforce ownership and payment status transitions', async () => {
    const payment = await service.createIdempotent(
      { userId: 'user-1', orderId: 'order-1', amount: 20 },
      'payment-key-000003',
    );

    await expect(service.findOne(payment.id, 'user-2')).rejects.toThrow(
      NotFoundException,
    );
    expect(await service.update(payment.id, 'user-1', { status: 'SUCCEEDED' })).toMatchObject({
      status: 'SUCCEEDED',
    });
    await expect(
      service.update(payment.id, 'user-1', { status: 'PENDING' }),
    ).rejects.toThrow(ConflictException);
    await expect(service.remove(payment.id, 'user-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should reject invalid payment amounts and short idempotency keys', async () => {
    await expect(
      service.createIdempotent({ userId: 'user-1', orderId: 'order-1', amount: 10 }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createIdempotent(
        { userId: 'user-1', orderId: 'order-1', amount: 0 },
        'payment-key-000004',
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createIdempotent(
        { userId: 'user-1', orderId: 'order-1', amount: 10 },
        'short-key',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
