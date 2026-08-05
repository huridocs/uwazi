import { ApiError } from '#shared/apiClient/ApiError.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';

const notImplemented = <T>(): ApiResponse<T> => [
  undefined as never,
  new ApiError('Not implemented', {
    kind: 'http',
    status: 501,
    code: 'NOT_IMPLEMENTED',
  }),
];

export { notImplemented };
