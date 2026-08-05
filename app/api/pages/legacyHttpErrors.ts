import { createError } from '#api/utils/index.js';
import {
  PageNotFoundError,
  PageUnauthorizedError,
  UnknownPageLanguageKeysError,
} from '#api/pages.v2/domain/errors.js';

const toLegacyHttpError = (error: unknown): unknown => {
  if (error instanceof PageNotFoundError) {
    return createError(error.message, 404);
  }
  if (error instanceof PageUnauthorizedError) {
    return createError(error.message, 401);
  }
  if (error instanceof UnknownPageLanguageKeysError) {
    return createError(error.message, 400);
  }
  return error;
};

export { toLegacyHttpError };
