import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

describe('Mtrade application integration', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const users = new Map<string, any>();
    const credentials = new Map<string, any>();
    const prismaMock = {
      $transaction: jest.fn(async (callback) =>
        callback({
          user: {
            create: jest.fn(async ({ data }) => {
              const user = {
                id: data.id,
                email: data.email,
                firstName: data.firstName ?? null,
                lastName: data.lastName ?? null,
                createdAt: new Date(),
                updatedAt: new Date(),
                authCredential: {
                  passwordHash: data.authCredential.create.passwordHash,
                },
              };
              users.set(user.id, user);
              credentials.set(user.email, user);
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
        create: jest.fn(async ({ data }) => {
          const user = {
            id: `profile-${users.size + 1}`,
            email: data.email,
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          users.set(user.id, user);
          return user;
        }),
        findUnique: jest.fn(async ({ where }) => {
          const user = users.get(where.id);
          return user ? { id: user.id, email: user.email } : null;
        }),
      },
    };

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should connect auth, JWT protection, users, and metrics', async () => {
    const email = `integration-${Date.now()}@mtrade.dev`;
    const credentials = {
      email,
      password: 'Password123!',
      firstName: 'Integration',
      lastName: 'User',
    };

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(credentials)
      .expect(201);
    const token = registerResponse.body.accessToken as string;

    expect(token.split('.')).toHaveLength(3);
    await request(app.getHttpServer()).get('/api/users').expect(401);

    await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/users/not-the-current-user')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        ownerId: 'spoofed-user-id',
        name: 'Rejected product',
        price: 10,
        stock: 1,
      })
      .expect(400);

    const metricsResponse = await request(app.getHttpServer())
      .get('/api/metrics')
      .expect(200);

    expect(metricsResponse.text).toContain('mtrade_http_requests_total');
    expect(metricsResponse.text).toContain('mtrade_auth_tokens_issued_total');
  });
});