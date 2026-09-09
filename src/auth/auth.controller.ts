import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { Public } from './decorators/public.decorator';
import type { AuthenticatedRequest } from '../types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  async logout(@Req() request: AuthenticatedRequest) {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    return this.authService.logout(request.user.sub, token);
  }

  @Post('validate')
  @Public()
  async validateToken(@Body('token') token: string) {
    return this.authService.validateToken(token);
  }
}
