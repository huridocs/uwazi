import { FetchResponseError } from '#shared/JSONRequest.js';
import { ApiResponse } from './ApiResponse.js';

const isFetchResponseError = (value: unknown): value is FetchResponseError =>
  value instanceof Error && 'status' in value;

const apiCall = async <T>(
  fn: () => Promise<T>
): Promise<ApiResponse<T, FetchResponseError>> => {
  try {
    return [await fn()];
  } catch (e) {
    return [undefined as T, e as FetchResponseError];
  }
};

/** Normalizes legacy api modules that return errors as values instead of throwing. */
const legacyApiCall = async <T>(
  fn: () => Promise<T | FetchResponseError>
): Promise<ApiResponse<T, FetchResponseError>> => {
  try {
    const result = await fn();
    if (isFetchResponseError(result)) {
      return [undefined as T, result];
    }
    return [result as T];
  } catch (e) {
    return [undefined as T, e as FetchResponseError];
  }
};

export { apiCall, legacyApiCall, isFetchResponseError };
