import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const users = new Map<string, any>();
    const prismaMock = {
      user: {
        create: jest.fn(async ({ data }) => {
          if ([...users.values()].some((user) => user.email === data.email)) {
            throw new Prisma.PrismaClientKnownRequestError('Duplicate email', {
              code: 'P2002',
              clientVersion: '6.15.0',
            });
          }

          const now = new Date();
          const user = {
            id: randomUUID(),
            email: data.email,
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            createdAt: now,
            updatedAt: now,
          };
          users.set(user.id, user);
          return user;
        }),
        findMany: jest.fn(async () => [...users.values()]),
        findUnique: jest.fn(async ({ where }) => users.get(where.id) ?? null),
        update: jest.fn(async ({ where, data }) => {
          const user = users.get(where.id);
          if (!user) throw new NotFoundException('User not found');
          Object.assign(user, data, { updatedAt: new Date() });
          return user;
        }),
        delete: jest.fn(async ({ where }) => {
          const user = users.get(where.id);
          if (!user) throw new NotFoundException('User not found');
          users.delete(where.id);
          return user;
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create and normalize a user email', async () => {
    const user = await service.create({
      email: ' USER@MTRADE.DEV ',
      firstName: 'Test',
      lastName: 'User',
    });

    expect(user).toMatchObject({
      email: 'user@mtrade.dev',
      firstName: 'Test',
      lastName: 'User',
    });
  });

  it('should reject duplicate emails', async () => {
    await service.create({ email: 'duplicate@mtrade.dev' });
    await expect(service.create({ email: 'DUPLICATE@mtrade.dev' })).rejects.toThrow(
      ConflictException,
    );
  });

  it('should update and remove users', async () => {
    const user = await service.create({ email: 'edit@mtrade.dev' });

    expect(await service.update(user.id, { firstName: 'Updated' })).toMatchObject({
      firstName: 'Updated',
    });
    expect(await service.remove(user.id)).toEqual({ success: true, userId: user.id });
    await expect(service.findOne(user.id)).rejects.toThrow(NotFoundException);
  });
});
