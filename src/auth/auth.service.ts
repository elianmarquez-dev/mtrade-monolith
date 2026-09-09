import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  createHash,
  createHmac,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { authLoginAttempts, authTokensIssued } from '../metrics';
import { PrismaService } from '../prisma/prisma.service';
import { AuthTokenPayload, AuthUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const deriveScryptKey = (
  password: string,
  salt: Buffer,
  keyLength: number,
) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      keyLength,
      { N: 16_384, r: 8, p: 1 },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey as Buffer);
      },
    );
  });

@Injectable()
export class AuthService {
  private readonly invalidatedTokens = new Set<string>();
  private readonly jwtSecret: string;

  constructor(private readonly prisma: PrismaService) {
    const configuredSecret = process.env.JWT_SECRET;
    if (process.env.NODE_ENV !== 'test' && (!configuredSecret || configuredSecret.length < 32)) {
      throw new Error('JWT_SECRET must be configured with at least 32 characters');
    }

    this.jwtSecret = configuredSecret ?? 'test-only-jwt-secret';
  }

  async register(registerDto: RegisterDto) {
    const email = this.normalizeEmail(registerDto.email);
    const password = registerDto.password?.trim();

    if (!email || !password) {
      throw new BadRequestException('Email and password are required');
    }
    let user: AuthUser;
    try {
      user = await this.prisma.$transaction(async (transaction) => {
        const createdUser = await transaction.user.create({
          data: {
            id: randomUUID(),
            email,
            firstName: registerDto.firstName?.trim(),
            lastName: registerDto.lastName?.trim(),
            authCredential: {
              create: {
                email,
                passwordHash: await this.hashPassword(password),
              },
            },
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
            authCredential: { select: { passwordHash: true } },
          },
        });

        if (!createdUser.authCredential) {
          throw new Error('Auth credential was not created');
        }

        return {
          id: createdUser.id,
          email: createdUser.email,
          firstName: createdUser.firstName ?? undefined,
          lastName: createdUser.lastName ?? undefined,
          passwordHash: createdUser.authCredential.passwordHash,
          createdAt: createdUser.createdAt,
          updatedAt: createdUser.updatedAt,
        };
      });
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('User already exists');
      }

      throw error;
    }

    const accessToken = this.generateAccessToken(user);
    authTokensIssued.inc({ type: 'access' });

    return {
      accessToken,
      user: this.serializeUser(user),
    };
  }

  async login(loginDto: LoginDto) {
    const email = this.normalizeEmail(loginDto.email);
    const password = loginDto.password?.trim();

    if (!email || !password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const credential = await this.prisma.authCredential.findUnique({
      where: { email },
      select: {
        passwordHash: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
    const user = credential?.user
      ? {
          ...credential.user,
          firstName: credential.user.firstName ?? undefined,
          lastName: credential.user.lastName ?? undefined,
          passwordHash: credential.passwordHash,
        }
      : undefined;

    if (!user || !(await this.verifyPassword(password, user.passwordHash))) {
      authLoginAttempts.inc({ result: 'failed' });
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    authLoginAttempts.inc({ result: 'success' });
    authTokensIssued.inc({ type: 'access' });

    return {
      accessToken,
      user: this.serializeUser(user),
    };
  }

  async logout(userId: string, token?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (token) {
      this.invalidatedTokens.add(token);
    }

    return {
      success: true,
      userId: user.id,
    };
  }

  async validateToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    if (this.invalidatedTokens.has(token)) {
      throw new UnauthorizedException('Token is no longer valid');
    }

    try {
      const payload = this.decodeToken(token);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true },
      });

      if (!user || user.email !== payload.email) {
        throw new UnauthorizedException('Invalid token');
      }

      return {
        sub: user.id,
        email: user.email,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (_error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private normalizeEmail(email?: string) {
    return email?.trim().toLowerCase();
  }

  private async hashPassword(password: string) {
    const salt = randomBytes(16);
    const derivedKey = await deriveScryptKey(password, salt, 64);

    return [
      'scrypt',
      '16384',
      '8',
      '1',
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  private async verifyPassword(password: string, storedHash: string) {
    const parts = storedHash.split('$');

    if (parts.length !== 6 || parts[0] !== 'scrypt') {
      const legacyHash = createHash('sha256').update(password).digest('hex');
      return legacyHash === storedHash;
    }

    const [, , , , saltBase64, hashBase64] = parts;
    const salt = Buffer.from(saltBase64, 'base64url');
    const expectedHash = Buffer.from(hashBase64, 'base64url');
    const derivedHash = await deriveScryptKey(
      password,
      salt,
      expectedHash.length,
    );

    return (
      derivedHash.length === expectedHash.length &&
      timingSafeEqual(derivedHash, expectedHash)
    );
  }

  private generateAccessToken(user: AuthUser) {
    const issuedAt = Math.floor(Date.now() / 1000);
    const header = Buffer.from(
      JSON.stringify({ alg: 'HS256', typ: 'JWT' }),
    ).toString('base64url');

    const payload = Buffer.from(
      JSON.stringify({
        sub: user.id,
        email: user.email,
        iat: issuedAt,
        exp: issuedAt + 60 * 60,
      }),
    ).toString('base64url');

    const unsignedToken = `${header}.${payload}`;
    const signature = this.sign(unsignedToken);
    return `${unsignedToken}.${signature}`;
  }

  private decodeToken(token: string) {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Malformed token');
    }

    const [headerBase64, payloadBase64, signature] = parts;
    const unsignedToken = `${headerBase64}.${payloadBase64}`;
    const expectedSignature = this.sign(unsignedToken);
    const provided = Buffer.from(signature, 'base64url');
    const expected = Buffer.from(expectedSignature, 'base64url');

    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      throw new Error('Invalid signature');
    }

    const header = JSON.parse(
      Buffer.from(headerBase64, 'base64url').toString('utf8'),
    ) as { alg?: string; typ?: string };
    if (header.alg !== 'HS256' || header.typ !== 'JWT') {
      throw new Error('Invalid token header');
    }

    const payload = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf8'),
    ) as AuthTokenPayload;

    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  }

  private sign(unsignedToken: string) {
    return createHmac('sha256', this.jwtSecret)
      .update(unsignedToken)
      .digest('base64url');
  }

  private serializeUser(user: AuthUser) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
    };
  }

  private isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
