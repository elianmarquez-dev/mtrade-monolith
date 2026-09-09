import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import type { AuthenticatedRequest } from '../types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: { email: string; firstName?: string; lastName?: string }) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findCurrent(@Req() request: AuthenticatedRequest) {
    return this.usersService.findOne(request.user.sub);
  }

  @Get('all')
  findAll(@Req() request: AuthenticatedRequest) {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    this.assertCurrentUser(id, request);
    return this.usersService.findOne(request.user.sub);
  }

  @Get(':id/addresses')
  findAddresses(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    this.assertCurrentUser(id, request);
    return this.usersService.findAddresses(request.user.sub);
  }

  @Post(':id/addresses')
  addAddress(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() address: {
      label: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      isDefault?: boolean;
    },
  ) {
    this.assertCurrentUser(id, request);
    return this.usersService.createAddress(request.user.sub, address);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    this.assertCurrentUser(id, request);
    return this.usersService.update(request.user.sub, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    this.assertCurrentUser(id, request);
    return this.usersService.remove(request.user.sub);
  }

  private assertCurrentUser(id: string, request: AuthenticatedRequest) {
    if (id !== request.user.sub) {
      throw new ForbiddenException('Users can only access their own profile');
    }
  }
}
