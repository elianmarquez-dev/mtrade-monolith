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
          description: createProductDto.description?.trim() ?? '',
          price: this.validatePrice(createProductDto.price),
          stock: this.validateStock(createProductDto.stock),
          category: createProductDto.category?.trim() ?? 'General',
          imageUrl: createProductDto.imageUrl?.trim() ?? '',
          rating: createProductDto.rating ?? 4.8,
          reviewsCount: createProductDto.reviewsCount ?? 0,
          sku: createProductDto.sku?.trim() ?? `SKU-${Date.now()}`,
          isFeatured: createProductDto.isFeatured ?? false,
          tags: createProductDto.tags ?? [],
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

  async findAllPublic(filters?: {
    category?: string;
    search?: string;
    inStockOnly?: boolean;
    sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest';
  }) {
    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
      select: this.productSelect,
    });

    let rows = products.map((product) => this.serializeProduct(product));

    if (filters?.category && filters.category !== 'Todos') {
      rows = rows.filter((product) => product.category === filters.category);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      rows = rows.filter((product) => {
        return (
          product.name.toLowerCase().includes(q) ||
          product.description?.toLowerCase().includes(q) ||
          product.category?.toLowerCase().includes(q) ||
          product.sku?.toLowerCase().includes(q) ||
          (product.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
        );
      });
    }

    if (filters?.inStockOnly) {
      rows = rows.filter((product) => product.stock > 0);
    }

    if (filters?.sortBy) {
      rows = [...rows];
      switch (filters.sortBy) {
        case 'price-asc':
          rows.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          rows.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          rows.sort((a, b) => b.rating - a.rating);
          break;
        default:
          rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }
    } else {
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return rows;
  }

  async findOnePublic(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, status: 'ACTIVE' },
      select: this.productSelect,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.serializeProduct(product);
  }

  async getCategories() {
    const products = await this.prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { category: true },
    });

    const cats = Array.from(
      new Set(products.map((product) => product.category ?? 'General')),
    );

    return ['Todos', ...cats];
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

    if (updateProductDto.category !== undefined) {
      data.category = updateProductDto.category.trim();
    }

    if (updateProductDto.imageUrl !== undefined) {
      data.imageUrl = updateProductDto.imageUrl.trim();
    }

    if (updateProductDto.rating !== undefined) {
      data.rating = this.validateRating(updateProductDto.rating);
    }

    if (updateProductDto.reviewsCount !== undefined) {
      data.reviewsCount = updateProductDto.reviewsCount;
    }

    if (updateProductDto.sku !== undefined) {
      data.sku = updateProductDto.sku.trim();
    }

    if (updateProductDto.isFeatured !== undefined) {
      data.isFeatured = updateProductDto.isFeatured;
    }

    if (updateProductDto.tags !== undefined) {
      data.tags = updateProductDto.tags;
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
    category: true,
    imageUrl: true,
    rating: true,
    reviewsCount: true,
    sku: true,
    isFeatured: true,
    tags: true,
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
    category: string | null;
    imageUrl: string | null;
    rating: Prisma.Decimal | null;
    reviewsCount: number;
    sku: string | null;
    isFeatured: boolean;
    tags: string[] | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      ...product,
      price: product.price.toNumber(),
      rating: product.rating ? product.rating.toNumber() : 4.8,
      category: product.category ?? 'General',
      imageUrl: product.imageUrl ?? 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&w=800&q=80',
      sku: product.sku ?? product.id,
      tags: product.tags ?? [],
      compareAtPrice: null,
      isFeatured: product.isFeatured,
      title: product.name,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
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

  private validateRating(rating: number) {
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      throw new BadRequestException('Product rating is invalid');
    }

    return Math.round(rating * 100) / 100;
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
