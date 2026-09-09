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

  async findAddresses(userId: string) {
    const normalizedUserId = this.requireUserId(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const addresses = await this.prisma.address.findMany({
      where: { userId: normalizedUserId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: this.addressSelect,
    });

    return addresses.map((address) => this.serializeAddress(address));
  }

  async createAddress(
    userId: string,
    createAddressDto: {
      label: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      isDefault?: boolean;
    },
  ) {
    const normalizedUserId = this.requireUserId(userId);
    const label = this.requireText(createAddressDto.label, 'Label');
    const street = this.requireText(createAddressDto.street, 'Street');
    const city = this.requireText(createAddressDto.city, 'City');
    const state = this.requireText(createAddressDto.state, 'State');
    const postalCode = this.requireText(createAddressDto.postalCode, 'Postal code');
    const country = this.requireText(createAddressDto.country, 'Country');

    const user = await this.prisma.user.findUnique({
      where: { id: normalizedUserId },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const payload = {
      userId: normalizedUserId,
      label,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault: createAddressDto.isDefault ?? false,
    };

    try {
      const address = await this.prisma.$transaction(async (transaction) => {
        if (payload.isDefault) {
          await transaction.address.updateMany({
            where: { userId: normalizedUserId, isDefault: true },
            data: { isDefault: false },
          });
        }

        const created = await transaction.address.create({
          data: payload,
          select: this.addressSelect,
        });

        return this.serializeAddress(created);
      });

      return address;
    } catch (error) {
      this.handlePersistenceError(error);
    }
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

  private readonly addressSelect = {
    id: true,
    userId: true,
    label: true,
    street: true,
    city: true,
    state: true,
    postalCode: true,
    country: true,
    isDefault: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private serializeAddress(address: {
    id: string;
    userId: string;
    label: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: address.id,
      userId: address.userId,
      label: address.label,
      street: address.street,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }

  private requireEmail(email?: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    return normalizedEmail;
  }

  private requireUserId(userId?: string) {
    const normalizedUserId = userId?.trim();
    if (!normalizedUserId) {
      throw new BadRequestException('User id is required');
    }

    return normalizedUserId;
  }

  private requireText(value: string | undefined, field: string) {
    const normalized = value?.trim();
    if (!normalized) {
      throw new BadRequestException(`${field} is required`);
    }

    return normalized;
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
