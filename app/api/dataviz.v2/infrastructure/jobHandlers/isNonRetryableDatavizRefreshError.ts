import { DatavizError } from '#api/dataviz.v2/domain/errors.js';

const NON_RETRYABLE_DATAVIZ_REFRESH_CODES = new Set([
  'DATAVIZ_NOT_FOUND',
  'DATAVIZ_INVALID_QUERY',
  'DATAVIZ_LIVE_NOT_ALLOWED',
  'DATAVIZ_BROKEN',
]);

const isNonRetryableDatavizRefreshError = (error: unknown): error is DatavizError =>
  error instanceof DatavizError && NON_RETRYABLE_DATAVIZ_REFRESH_CODES.has(error.code);

export { isNonRetryableDatavizRefreshError, NON_RETRYABLE_DATAVIZ_REFRESH_CODES };
