import type { Response } from 'express';
import {
  InvalidPageReleaseError,
  PageNotFoundError,
  PageReleaseNotFoundError,
  UnknownPageLanguageKeysError,
} from '../../domain/errors.js';

const mapPageHttpErrors = (error: unknown, response: Response): boolean => {
  if (error instanceof PageNotFoundError || error instanceof PageReleaseNotFoundError) {
    response.status(404).json({ message: error.message });
    return true;
  }

  if (error instanceof UnknownPageLanguageKeysError || error instanceof InvalidPageReleaseError) {
    response.status(400).json({ message: error.message });
    return true;
  }

  return false;
};

export { mapPageHttpErrors };
