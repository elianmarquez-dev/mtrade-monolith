import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { Observable, catchError, finalize, throwError } from 'rxjs';
import { httpRequestDurationMs, httpRequestsTotal } from '../../metrics';
import type { MetricsRequest } from '../../types';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<MetricsRequest>();
    const response = context.switchToHttp().getResponse<Response>();
    let failed = false;

    return next.handle().pipe(
      catchError((error: unknown) => {
        failed = true;
        return throwError(() => error);
      }),
      finalize(() => {
        const duration = Date.now() - (request.metricsStartedAt ?? Date.now());
        const statusCode = String(failed ? response.statusCode || 500 : response.statusCode);

        httpRequestsTotal.inc({ method: request.method, status_code: statusCode });
        httpRequestDurationMs.observe(
          { method: request.method, status_code: statusCode },
          duration,
        );
      }),
    );
  }
}
