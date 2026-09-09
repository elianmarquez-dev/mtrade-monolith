import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import type { AuthenticatedRequest } from '../types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findCurrent(@Req() request: AuthenticatedRequest) {
    return this.usersService.findOne(request.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    this.assertCurrentUser(id, request);
    return this.usersService.findOne(request.user.sub);
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
