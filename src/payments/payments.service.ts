import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'node:crypto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from './entities/payment.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(
    createPaymentDto: CreatePaymentDto & { userId: string },
    idempotencyKey: string,
  ) {
    return this.createIdempotent(createPaymentDto, idempotencyKey);
  }

  async createIdempotent(
    createPaymentDto: CreatePaymentDto & { userId: string },
    idempotencyKey?: string,
  ) {
    const userId = this.requireValue(createPaymentDto.userId, 'User id');
    const orderId = this.requireValue(createPaymentDto.orderId, 'Order id');
    const amount = this.validateAmount(createPaymentDto.amount);
    const normalizedKey = this.normalizeIdempotencyKey(idempotencyKey);
    const provider = createPaymentDto.provider?.trim();
    const fingerprint = this.fingerprint({ userId, orderId, amount, provider });

    try {
      const payment = await this.prisma.$transaction(async (transaction) => {
        const existing = await transaction.payment.findUnique({
          where: { idempotencyKey: normalizedKey },
          select: this.paymentSelect,
        });

        if (existing) {
          this.assertSameRequest(existing, fingerprint);
          return existing;
        }

        const order = await transaction.order.findFirst({
          where: { id: orderId, userId },
          select: { id: true },
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        return transaction.payment.create({
          data: {
            orderId,
            userId,
            amount,
            provider,
            idempotencyKey: normalizedKey,
          },
          select: this.paymentSelect,
        });
      });

      return this.serializePayment(payment);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      if (this.isUniqueConstraintError(error)) {
        const existing = await this.prisma.payment.findUnique({
          where: { idempotencyKey: normalizedKey },
          select: this.paymentSelect,
        });

        if (existing) {
          this.assertSameRequest(existing, fingerprint);
          return this.serializePayment(existing);
        }
      }

      throw error;
    }
  }

  async findAll(userId: string) {
    const normalizedUserId = this.requireValue(userId, 'User id');
    const payments = await this.prisma.payment.findMany({
      where: { userId: normalizedUserId },
      orderBy: { createdAt: 'desc' },
      select: this.paymentSelect,
    });

    return payments.map((payment) => this.serializePayment(payment));
  }

  async findOne(id: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, userId: this.requireValue(userId, 'User id') },
      select: this.paymentSelect,
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return this.serializePayment(payment);
  }

  async update(id: string, userId: string, updatePaymentDto: UpdatePaymentDto) {
    const normalizedUserId = this.requireValue(userId, 'User id');
    const payment = await this.prisma.payment.findFirst({
      where: { id, userId: normalizedUserId },
      select: this.paymentSelect,
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (updatePaymentDto.status === undefined) {
      return this.serializePayment(payment);
    }

    const nextStatus = updatePaymentDto.status as PaymentStatus;
    if (!this.canTransition(payment.status, nextStatus)) {
      throw new ConflictException('Invalid payment status transition');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: { status: nextStatus },
      select: this.paymentSelect,
    });

    return this.serializePayment(updated);
  }

  async remove(id: string, userId: string) {
    const normalizedUserId = this.requireValue(userId, 'User id');
    const payment = await this.prisma.payment.findFirst({
      where: { id, userId: normalizedUserId },
      select: { id: true, status: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      throw new ConflictException('Only pending payments can be removed');
    }

    await this.prisma.payment.delete({ where: { id: payment.id } });
    return { success: true, paymentId: payment.id };
  }

  private readonly paymentSelect = {
    id: true,
    orderId: true,
    userId: true,
    amount: true,
    status: true,
    provider: true,
    providerPaymentId: true,
    idempotencyKey: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private serializePayment(payment: {
    id: string;
    orderId: string;
    userId: string;
    amount: Prisma.Decimal;
    status: PaymentStatus;
    provider: string | null;
    providerPaymentId: string | null;
    idempotencyKey: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...payment,
      amount: payment.amount.toNumber(),
    };
  }

  private assertSameRequest(
    payment: {
      userId: string;
      orderId: string;
      amount: Prisma.Decimal;
      provider: string | null;
    },
    fingerprint: string,
  ) {
    const storedFingerprint = this.fingerprint({
      userId: payment.userId,
      orderId: payment.orderId,
      amount: payment.amount.toNumber(),
      provider: payment.provider ?? undefined,
    });

    if (storedFingerprint !== fingerprint) {
      throw new ConflictException(
        'Idempotency key was already used with another payment',
      );
    }
  }

  private requireValue(value: string | undefined, label: string) {
    const normalizedValue = value?.trim();
    if (!normalizedValue) {
      throw new BadRequestException(`${label} is required`);
    }

    return normalizedValue;
  }

  private validateAmount(amount: number) {
    if (!Number.isFinite(amount) || amount < 0.01) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return Math.round(amount * 100) / 100;
  }

  private normalizeIdempotencyKey(key?: string) {
    const normalizedKey = key?.trim();
    if (!normalizedKey) {
      throw new BadRequestException('Idempotency key is required');
    }

    if (normalizedKey.length < 16) {
      throw new BadRequestException(
        'Idempotency key must be at least 16 characters long',
      );
    }

    return normalizedKey;
  }

  private fingerprint(payload: Record<string, unknown>) {
    return createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  private canTransition(current: PaymentStatus, next: PaymentStatus) {
    if (current === next) {
      return true;
    }

    return (
      (current === 'PENDING' && ['SUCCEEDED', 'FAILED'].includes(next)) ||
      (current === 'SUCCEEDED' && next === 'REFUNDED')
    );
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
