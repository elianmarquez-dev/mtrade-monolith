import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const email = this.requireEmail(createUserDto.email);

    try {
      return await this.prisma.user.create({
        data: {
          email,
          firstName: createUserDto.firstName?.trim(),
          lastName: createUserDto.lastName?.trim(),
        },
        select: this.userSelect,
      });
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: this.userSelect,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          ...(updateUserDto.firstName !== undefined
            ? { firstName: updateUserDto.firstName.trim() }
            : {}),
          ...(updateUserDto.lastName !== undefined
            ? { lastName: updateUserDto.lastName.trim() }
            : {}),
        },
        select: this.userSelect,
      });
    } catch (error) {
      this.handlePersistenceError(error);
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      this.handlePersistenceError(error);
    }

    return { success: true, userId: id };
  }

  private readonly userSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private requireEmail(email?: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    return normalizedEmail;
  }

  private handlePersistenceError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException('User already exists');
      }

      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }

      if (error.code === 'P2003') {
        throw new ConflictException('User cannot be removed');
      }
    }

    throw error;
  }
}
