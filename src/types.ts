import type { Request } from 'express';

export type MetricsRequest = Request & {
  metricsStartedAt?: number;
};

export type AuthenticatedRequest = Request & {
  user: {
    sub: string;
    email: string;
  };
};