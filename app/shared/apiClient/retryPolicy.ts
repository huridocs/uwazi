import type { ApiError } from './ApiError.js';
import type { HttpMethod } from './types.js';

type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  totalDeadlineMs: number;
  perAttemptTimeoutMs: number;
};

const IDEMPOTENT_METHODS = new Set<HttpMethod>(['GET', 'HEAD', 'DELETE', 'PUT']);

const isIdempotentMethod = (method: HttpMethod) => IDEMPOTENT_METHODS.has(method);

const parseRetryAfterMs = (value: string | null): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
};

const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 30_000,
  totalDeadlineMs: 60_000,
  perAttemptTimeoutMs: 30_000,
};

const mergeRetryPolicy = (...partials: Array<Partial<RetryPolicy> | undefined>): RetryPolicy => ({
  ...defaultRetryPolicy,
  ...Object.assign({}, ...partials.filter(Boolean)),
});

const computeRetryDelayMs = (
  attempt: number,
  policy: RetryPolicy,
  retryAfterMs?: number
): number => {
  if (retryAfterMs !== undefined) return Math.min(retryAfterMs, policy.maxDelayMs);
  const cap = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** attempt);
  return Math.floor(Math.random() * cap);
};

const shouldRetry = (
  error: ApiError,
  method: HttpMethod,
  attempt: number,
  policy: RetryPolicy,
  startedAt: number
  // eslint-disable-next-line max-params
): boolean => {
  if (attempt >= policy.maxAttempts - 1) return false;
  if (Date.now() - startedAt >= policy.totalDeadlineMs) return false;
  if (error.kind === 'cancelled' || error.kind === 'parse') return false;
  if (error.retryable === false) return false;
  if (!isIdempotentMethod(method)) return false;
  if (error.kind === 'network' || error.kind === 'timeout') return true;
  if (error.status && [408, 429, 502, 503, 504].includes(error.status)) return true;
  return error.retryable === true;
};

const sleep = async (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

export {
  computeRetryDelayMs,
  defaultRetryPolicy,
  isIdempotentMethod,
  mergeRetryPolicy,
  parseRetryAfterMs,
  shouldRetry,
  sleep,
};
export type { RetryPolicy };
