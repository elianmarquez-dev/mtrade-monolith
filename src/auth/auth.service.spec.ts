import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'node:crypto';

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: {
    $transaction: jest.Mock;
    authCredential: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
  };

  beforeEach(async () => {
    const users = new Map<string, any>();
    const credentials = new Map<string, any>();
    prismaMock = {
      $transaction: jest.fn(async (callback) =>
        callback({
          user: {
            create: jest.fn(async ({ data }) => {
              const id = data.id ?? randomUUID();
              const now = new Date();
              const user = {
                id,
                email: data.email,
                firstName: data.firstName ?? null,
                lastName: data.lastName ?? null,
                createdAt: now,
                updatedAt: now,
                authCredential: {
                  passwordHash: data.authCredential.create.passwordHash,
                },
              };
              users.set(id, user);
              credentials.set(data.email, user);
              return user;
            }),
          },
        }),
      ),
      authCredential: {
        findUnique: jest.fn(async ({ where }) => {
          const user = credentials.get(where.email);
          return user
            ? { passwordHash: user.authCredential.passwordHash, user }
            : null;
        }),
      },
      user: {
        findUnique: jest.fn(async ({ where }) => {
          const user = users.get(where.id);
          return user ? { id: user.id, email: user.email } : null;
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new user and return a token payload', async () => {
    const result = await service.register({
      email: 'new.user@mtrade.dev',
      password: 'Password123!',
      firstName: 'New',
      lastName: 'User',
    });

    expect(result).toMatchObject({
      user: {
        email: 'new.user@mtrade.dev',
        firstName: 'New',
        lastName: 'User',
      },
    });
    expect(result.accessToken).toBeDefined();
  });

  it('should login with valid credentials', async () => {
    await service.register({
      email: 'login.user@mtrade.dev',
      password: 'Password123!',
      firstName: 'Login',
      lastName: 'User',
    });

    const result = await service.login({
      email: 'login.user@mtrade.dev',
      password: 'Password123!',
    });

    expect(result).toMatchObject({
      user: {
        email: 'login.user@mtrade.dev',
      },
    });
    expect(result.accessToken).toBeDefined();
  });

  it('should reject invalid login credentials', async () => {
    await service.register({
      email: 'bad.login@mtrade.dev',
      password: 'Password123!',
      firstName: 'Bad',
      lastName: 'Login',
    });

    await expect(
      service.login({
        email: 'bad.login@mtrade.dev',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('should logout a user and invalidate the current session', async () => {
    const registerResult = await service.register({
      email: 'logout.user@mtrade.dev',
      password: 'Password123!',
      firstName: 'Logout',
      lastName: 'User',
    });

    const response = await service.logout(registerResult.user.id, registerResult.accessToken);

    expect(response).toMatchObject({
      success: true,
      userId: registerResult.user.id,
    });
  });

  it('should validate a generated access token', async () => {
    const registerResult = await service.register({
      email: 'validate.user@mtrade.dev',
      password: 'Password123!',
      firstName: 'Validate',
      lastName: 'User',
    });

    const payload = await service.validateToken(registerResult.accessToken);

    expect(payload).toMatchObject({
      sub: registerResult.user.id,
      email: 'validate.user@mtrade.dev',
    });
  });
});
