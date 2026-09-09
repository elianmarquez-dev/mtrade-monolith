import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { MetricsRequest } from '../../types';

@Injectable()
export class MetricsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<MetricsRequest>();
    request.metricsStartedAt = Date.now();

    return true;
  }
}
