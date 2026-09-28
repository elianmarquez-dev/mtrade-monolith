import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const products = new Map<string, any>();
    const reviews = new Map<string, any>();
    const prismaMock: any = {
      product: {
        create: jest.fn(async ({ data }) => {
          const now = new Date();
          const product = {
            id: randomUUID(),
            ownerId: data.ownerId,
            name: data.name,
            description: data.description ?? null,
            price: new Prisma.Decimal(data.price),
            stock: data.stock,
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
          };
          products.set(product.id, product);
          return product;
        }),
        findMany: jest.fn(async ({ where }: any) =>
          [...products.values()].filter(
            (product) =>
              product.ownerId === where.ownerId &&
              product.status === where.status,
          ),
        ),
        findFirst: jest.fn(async ({ where }: any) => {
          const product = products.get(where.id);
          return product &&
            (where.ownerId === undefined || product.ownerId === where.ownerId) &&
            (where.status === undefined || product.status === where.status)
            ? product
            : null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const product = products.get(where.id);
          if (!product || (where.ownerId && product.ownerId !== where.ownerId)) {
            throw new NotFoundException('Product not found');
          }
          Object.assign(product, data);
          if (data.price !== undefined) {
            product.price = new Prisma.Decimal(data.price);
          }
          if (data.rating !== undefined) {
            product.rating = new Prisma.Decimal(data.rating);
          }
          product.updatedAt = new Date();
          return product;
        }),
        deleteMany: jest.fn(async ({ where }: any) => {
          const product = products.get(where.id);
          if (!product || product.ownerId !== where.ownerId) return { count: 0 };
          products.delete(where.id);
          return { count: 1 };
        }),
      },
      productReview: {
        findMany: jest.fn(async ({ where }: any) =>
          [...reviews.values()].filter((review) => review.productId === where.productId),
        ),
        upsert: jest.fn(async ({ where, create, update }: any) => {
          const key = `${where.productId_userId.productId}:${where.productId_userId.userId}`;
          const review = reviews.get(key) ?? {
            id: randomUUID(),
            ...create,
            createdAt: new Date(),
            user: { firstName: 'Test', lastName: 'Customer' },
          };
          Object.assign(review, update);
          reviews.set(key, review);
          return review;
        }),
        aggregate: jest.fn(async ({ where }: any) => {
          const matchingReviews = [...reviews.values()].filter(
            (review) => review.productId === where.productId,
          );
          return {
            _avg: {
              rating: matchingReviews.length
                ? matchingReviews.reduce((sum, review) => sum + review.rating, 0) /
                  matchingReviews.length
                : null,
            },
            _count: { _all: matchingReviews.length },
          };
        }),
      },
      $transaction: jest.fn((callback: (transaction: any) => Promise<any>) =>
        callback(prismaMock),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a product for its owner', async () => {
    const product = await service.create({
      ownerId: 'user-1',
      name: 'Keyboard',
      description: 'Mechanical keyboard',
      price: 99.9,
      stock: 4,
    });

    expect(product).toMatchObject({
      ownerId: 'user-1',
      name: 'Keyboard',
      price: 99.9,
      stock: 4,
      status: 'ACTIVE',
    });
    expect(product.id).toBeDefined();
  });

  it('should only return active products owned by the requested user', async () => {
    const ownedProduct = await service.create({
      ownerId: 'user-1',
      name: 'Owned product',
      price: 10,
      stock: 1,
    });
    await service.create({
      ownerId: 'user-2',
      name: 'Other product',
      price: 20,
      stock: 2,
    });

    expect(await service.findAll('user-1')).toEqual([ownedProduct]);
    await expect(service.findOne(ownedProduct.id, 'user-2')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update and remove an owned product', async () => {
    const product = await service.create({
      ownerId: 'user-1',
      name: 'Original',
      price: 10,
      stock: 1,
    });

    const updated = await service.update(product.id, 'user-1', {
      name: 'Updated',
      stock: 3,
    });

    expect(updated).toMatchObject({ name: 'Updated', stock: 3 });
    expect(await service.remove(product.id, 'user-1')).toEqual({
      success: true,
      productId: product.id,
    });
    await expect(service.findOne(product.id, 'user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create and list product reviews and update the aggregate rating', async () => {
    const product = await service.create({
      ownerId: 'owner-1',
      name: 'Reviewed product',
      price: 25,
      stock: 2,
    });

    const review = await service.createReview(product.id, 'customer-1', {
      rating: 5,
      comment: '  Excellent product  ',
    });

    expect(review).toMatchObject({
      rating: 5,
      comment: 'Excellent product',
      authorName: 'Test Customer',
    });
    expect(await service.getReviews(product.id)).toEqual([review]);
    await expect(service.findOnePublic(product.id)).resolves.toMatchObject({
      rating: 5,
      reviewsCount: 1,
    });
  });

  it('should prevent owners from reviewing their own products', async () => {
    const product = await service.create({
      ownerId: 'owner-1',
      name: 'Owned product',
      price: 25,
      stock: 2,
    });

    await expect(
      service.createReview(product.id, 'owner-1', {
        rating: 5,
        comment: 'My own product',
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject requests without an owner id', async () => {
    await expect(service.findAll('')).rejects.toThrow(BadRequestException);
  });
});
