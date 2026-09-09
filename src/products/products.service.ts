import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto & { ownerId: string }) {
    const ownerId = this.requireOwnerId(createProductDto.ownerId);
    const name = this.requireName(createProductDto.name);

    try {
      const product = await this.prisma.product.create({
        data: {
          ownerId,
          name,
          description: createProductDto.description?.trim(),
          price: this.validatePrice(createProductDto.price),
          stock: this.validateStock(createProductDto.stock),
        },
        select: this.productSelect,
      });

      return this.serializeProduct(product);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async findAll(ownerId: string) {
    const products = await this.prisma.product.findMany({
      where: {
        ownerId: this.requireOwnerId(ownerId),
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
      select: this.productSelect,
    });

    return products.map((product) => this.serializeProduct(product));
  }

  async findOne(id: string, ownerId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, ownerId: this.requireOwnerId(ownerId) },
      select: this.productSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.serializeProduct(product);
  }

  async update(id: string, ownerId: string, updateProductDto: UpdateProductDto) {
    const data: Prisma.ProductUpdateInput = {};

    if (updateProductDto.name !== undefined) {
      data.name = this.requireName(updateProductDto.name);
    }

    if (updateProductDto.description !== undefined) {
      data.description = updateProductDto.description.trim();
    }

    if (updateProductDto.price !== undefined) {
      data.price = this.validatePrice(updateProductDto.price);
    }

    if (updateProductDto.stock !== undefined) {
      data.stock = this.validateStock(updateProductDto.stock);
    }

    try {
      const product = await this.prisma.product.update({
        where: { id, ownerId: this.requireOwnerId(ownerId) },
        data,
        select: this.productSelect,
      });

      return this.serializeProduct(product);
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async remove(id: string, ownerId: string) {
    try {
      const result = await this.prisma.product.deleteMany({
        where: { id, ownerId: this.requireOwnerId(ownerId) },
      });

      if (result.count === 0) {
        throw new NotFoundException('Product not found');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.handlePersistenceError(error);
    }

    return { success: true, productId: id };
  }

  private readonly productSelect = {
    id: true,
    ownerId: true,
    name: true,
    description: true,
    price: true,
    stock: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private serializeProduct(product: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    price: Prisma.Decimal;
    stock: number;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...product,
      price: product.price.toNumber(),
    };
  }

  private requireOwnerId(ownerId?: string) {
    const normalizedOwnerId = ownerId?.trim();
    if (!normalizedOwnerId) {
      throw new BadRequestException('Owner id is required');
    }

    return normalizedOwnerId;
  }

  private requireName(name?: string) {
    const normalizedName = name?.trim();
    if (!normalizedName) {
      throw new BadRequestException('Product name is required');
    }

    return normalizedName;
  }

  private validatePrice(price: number) {
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('Product price is invalid');
    }

    return Math.round(price * 100) / 100;
  }

  private validateStock(stock: number) {
    if (!Number.isInteger(stock) || stock < 0) {
      throw new BadRequestException('Product stock is invalid');
    }

    return stock;
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025' || error.code === 'P2003') {
        throw new NotFoundException('Product not found');
      }
    }

    throw error;
  }
}
