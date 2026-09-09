import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { register } from 'prom-client';
import { Public } from './auth/decorators/public.decorator';
import { AppService } from './app.service';

@Controller()
@Public()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello() {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'mtrade-monolith',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('metrics')
  async getMetrics(@Req() _req: Request, @Res() res: Response) {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  }
}
