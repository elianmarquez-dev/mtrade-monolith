import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const products = new Map<string, any>();
    const prismaMock = {
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
          return product?.ownerId === where.ownerId ? product : null;
        }),
        update: jest.fn(async ({ where, data }: any) => {
          const product = products.get(where.id);
          if (!product || product.ownerId !== where.ownerId) {
            throw new NotFoundException('Product not found');
          }
          Object.assign(product, data);
          if (data.price !== undefined) {
            product.price = new Prisma.Decimal(data.price);
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

  it('should reject requests without an owner id', async () => {
    await expect(service.findAll('')).rejects.toThrow(BadRequestException);
  });
});
