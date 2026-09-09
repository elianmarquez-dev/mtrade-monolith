import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from './entities/order.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto & { userId: string }) {
    const userId = this.requireUserId(createOrderDto.userId);
    const items = this.validateItems(createOrderDto.items);
    const totalAmount = this.resolveTotalAmount(
      createOrderDto.totalAmount,
      items,
    );

    try {
      const order = await this.prisma.order.create({
        data: {
          userId,
          totalAmount,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
            })),
          },
        },
        select: this.orderSelect,
      });

      return this.serializeOrder(order);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findAll(userId: string) {
    const normalizedUserId = this.requireUserId(userId);

    const orders = await this.prisma.order.findMany({
      where: { userId: normalizedUserId },
      orderBy: { createdAt: 'desc' },
      select: this.orderSelect,
    });

    return orders.map((order) => this.serializeOrder(order));
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId: this.requireUserId(userId) },
      select: this.orderSelect,
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.serializeOrder(order);
  }

  async update(id: string, userId: string, updateOrderDto: UpdateOrderDto) {
    const normalizedUserId = this.requireUserId(userId);
    if (
      updateOrderDto.status !== undefined &&
      !this.isOrderStatus(updateOrderDto.status)
    ) {
      throw new BadRequestException('Invalid order status');
    }

    const items = updateOrderDto.items
      ? this.validateItems(updateOrderDto.items)
      : undefined;
    const data: Prisma.OrderUpdateInput = {};

    if (updateOrderDto.status !== undefined) {
      data.status = updateOrderDto.status as OrderStatus;
    }

    if (items) {
      data.totalAmount = this.resolveTotalAmount(
        updateOrderDto.totalAmount,
        items,
      );
      data.items = {
        deleteMany: {},
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };
    } else if (updateOrderDto.totalAmount !== undefined) {
      data.totalAmount = updateOrderDto.totalAmount;
    }

    try {
      const order = await this.prisma.order.update({
        where: { id, userId: normalizedUserId },
        data,
        select: this.orderSelect,
      });

      return this.serializeOrder(order);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async remove(id: string, userId: string) {
    try {
      const result = await this.prisma.order.deleteMany({
        where: { id, userId: this.requireUserId(userId) },
      });

      if (result.count === 0) {
        throw new NotFoundException('Order not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (this.isForeignKeyError(error)) {
        throw new ConflictException('Order cannot be removed');
      }

      throw error;
    }

    return {
      success: true,
      orderId: id,
    };
  }

  private requireUserId(userId?: string) {
    const normalizedUserId = userId?.trim();

    if (!normalizedUserId) {
      throw new BadRequestException('User id is required');
    }

    return normalizedUserId;
  }

  private validateItems(items?: CreateOrderDto['items']) {
    if (!items?.length) {
      throw new BadRequestException('Order must contain at least one item');
    }

    if (
      items.some(
        (item) =>
          !item.productId?.trim() ||
          item.quantity < 1 ||
          item.unitPrice < 0,
      )
    ) {
      throw new BadRequestException('Order items are invalid');
    }

    return items.map((item) => ({
      ...item,
      productId: item.productId.trim(),
    }));
  }

  private calculateTotal(items: CreateOrderDto['items']) {
    return items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
  }

  private resolveTotalAmount(
    requestedTotal: number | undefined,
    items: CreateOrderDto['items'],
  ) {
    const calculatedTotal = this.calculateTotal(items);
    if (
      requestedTotal !== undefined &&
      Math.round(requestedTotal * 100) !== Math.round(calculatedTotal * 100)
    ) {
      throw new BadRequestException('Order total does not match its items');
    }

    return requestedTotal ?? calculatedTotal;
  }

  private isOrderStatus(status: string): status is OrderStatus {
    return ['PENDING', 'CONFIRMED', 'CANCELLED'].includes(status);
  }

  private readonly orderSelect = {
    id: true,
    userId: true,
    status: true,
    totalAmount: true,
    createdAt: true,
    updatedAt: true,
    items: {
      select: {
        id: true,
        productId: true,
        quantity: true,
        unitPrice: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' as const },
    },
  } as const;

  private serializeOrder(order: {
    id: string;
    userId: string;
    status: OrderStatus;
    totalAmount: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      id: string;
      productId: string;
      quantity: number;
      unitPrice: Prisma.Decimal;
      createdAt: Date;
    }>;
  }) {
    return {
      ...order,
      totalAmount: order.totalAmount.toNumber(),
      items: order.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toNumber(),
      })),
    };
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025' || error.code === 'P2003') {
        throw new NotFoundException('Order not found');
      }

      if (error.code === 'P2014') {
        throw new ConflictException('Order cannot be modified');
      }
    }

    throw error;
  }

  private isForeignKeyError(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    );
  }
}
