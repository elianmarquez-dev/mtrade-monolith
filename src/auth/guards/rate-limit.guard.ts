import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type Bucket = {
  tokens: number;
  lastRefillAt: number;
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity = this.readPositiveInteger('RATE_LIMIT_BUCKET_CAPACITY', 60);
  private readonly refillPerSecond = this.readPositiveNumber('RATE_LIMIT_REFILL_PER_SECOND', 1);

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const key = this.getClientKey(request);
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? {
      tokens: this.capacity,
      lastRefillAt: now,
    };

    const elapsedSeconds = Math.max(0, (now - bucket.lastRefillAt) / 1000);
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSeconds * this.refillPerSecond);
    bucket.lastRefillAt = now;

    const remaining = Math.max(0, Math.floor(bucket.tokens));
    response.setHeader('X-RateLimit-Limit', this.capacity);
    response.setHeader('X-RateLimit-Remaining', remaining);

    if (bucket.tokens < 1) {
      const retryAfter = Math.max(1, Math.ceil((1 - bucket.tokens) / this.refillPerSecond));
      response.setHeader('Retry-After', retryAfter);
      this.buckets.set(key, bucket);
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    bucket.tokens -= 1;
    response.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens));
    this.buckets.set(key, bucket);
    this.removeExpiredBuckets(now);
    return true;
  }

  private getClientKey(request: Request): string {
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private removeExpiredBuckets(now: number): void {
    if (this.buckets.size < 1000) return;

    const expirationMs = Math.max(60_000, (this.capacity / this.refillPerSecond) * 2 * 1000);
    for (const [key, bucket] of this.buckets) {
      if (now - bucket.lastRefillAt > expirationMs) {
        this.buckets.delete(key);
      }
    }
  }

  private readPositiveInteger(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isInteger(value) && value > 0 ? value : fallback;
  }

  private readPositiveNumber(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}
