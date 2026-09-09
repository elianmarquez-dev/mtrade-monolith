import { register, Counter, Histogram, Summary } from 'prom-client';

export const httpRequestsTotal = new Counter({
  name: 'mtrade_http_requests_total',
  help: 'Total number of HTTP requests handled by the app.',
  labelNames: ['method', 'status_code'],
});

export const httpRequestDurationMs = new Histogram({
  name: 'mtrade_http_request_duration_ms',
  help: 'Duration of HTTP requests in milliseconds.',
  labelNames: ['method', 'status_code'],
  buckets: [50, 100, 200, 500, 1000, 2000, 5000],
});

export const authLoginAttempts = new Counter({
  name: 'mtrade_auth_login_attempts_total',
  help: 'Total number of login attempts.',
  labelNames: ['result'],
});

export const authTokensIssued = new Counter({
  name: 'mtrade_auth_tokens_issued_total',
  help: 'Total number of auth tokens issued.',
  labelNames: ['type'],
});

export const httpRequestSizeBytes = new Summary({
  name: 'mtrade_http_request_size_bytes',
  help: 'Request size summaries.',
  labelNames: ['method'],
});

export const metricsRegistry = register;
