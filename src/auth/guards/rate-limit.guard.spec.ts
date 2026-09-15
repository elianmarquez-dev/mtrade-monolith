import { ExecutionContext, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { RateLimitGuard } from './rate-limit.guard';

function createContext(ip = '192.0.2.10') {
  const request = {
    ip,
    socket: { remoteAddress: ip },
  } as Request;
  const response = {
    setHeader: jest.fn(),
  } as unknown as Response;

  return {
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => response,
      }),
    } as ExecutionContext,
    response,
  };
}

describe('RateLimitGuard', () => {
  const originalCapacity = process.env.RATE_LIMIT_BUCKET_CAPACITY;
  const originalRefill = process.env.RATE_LIMIT_REFILL_PER_SECOND;

  afterEach(() => {
    if (originalCapacity === undefined) delete process.env.RATE_LIMIT_BUCKET_CAPACITY;
    else process.env.RATE_LIMIT_BUCKET_CAPACITY = originalCapacity;
    if (originalRefill === undefined) delete process.env.RATE_LIMIT_REFILL_PER_SECOND;
    else process.env.RATE_LIMIT_REFILL_PER_SECOND = originalRefill;
  });

  it('consumes one token and publishes remaining capacity', () => {
    process.env.RATE_LIMIT_BUCKET_CAPACITY = '2';
    process.env.RATE_LIMIT_REFILL_PER_SECOND = '1';
    const guard = new RateLimitGuard();
    const { context, response } = createContext();

    expect(guard.canActivate(context)).toBe(true);
    expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 2);
    expect(response.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 1);
  });

  it('returns 429 and retry information when the bucket is empty', () => {
    process.env.RATE_LIMIT_BUCKET_CAPACITY = '1';
    process.env.RATE_LIMIT_REFILL_PER_SECOND = '1';
    const guard = new RateLimitGuard();
    const first = createContext();
    const second = createContext();

    expect(guard.canActivate(first.context)).toBe(true);
    expect(() => guard.canActivate(second.context)).toThrow(HttpException);
    expect(second.response.setHeader).toHaveBeenCalledWith('Retry-After', 1);
  });
});
