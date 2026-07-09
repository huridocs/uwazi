import { ApiError } from './ApiError.js';
import { isLegacyHttpError, toApiError } from './normalizeError.js';
import type { ApiResponse } from './types.js';

const fromLegacyApi = async <T>(fn: () => Promise<T | Error>): Promise<ApiResponse<T>> => {
  try {
    const result = await fn();
    if (isLegacyHttpError(result)) {
      return [undefined as T, toApiError(result)];
    }
    return [result as T];
  } catch (e) {
    if (e instanceof ApiError) {
      return [undefined as T, e];
    }
    if (isLegacyHttpError(e) || e instanceof TypeError) {
      return [undefined as T, toApiError(e)];
    }
    throw e;
  }
};

export { fromLegacyApi };
