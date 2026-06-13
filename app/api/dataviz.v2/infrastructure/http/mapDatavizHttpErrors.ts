import type { Response } from 'express';
import {
  DatavizInvalidQueryError,
  DatavizNotFoundError,
  DatavizProcessingError,
  DatavizSnapshotUnavailableError,
  DatavizUnauthorizedError,
} from '#api/dataviz.v2/domain/errors.js';

const mapDatavizHttpErrors = (error: unknown, response: Response): boolean => {
  if (error instanceof DatavizNotFoundError) {
    response.status(404).json({ error: error.message, code: error.code });
    return true;
  }

  if (error instanceof DatavizUnauthorizedError) {
    response.status(401).json({ error: error.message, code: error.code });
    return true;
  }

  if (error instanceof DatavizProcessingError || error instanceof DatavizSnapshotUnavailableError) {
    response.status(503).json({ error: error.message, code: error.code });
    return true;
  }

  if (error instanceof DatavizInvalidQueryError) {
    response.status(400).json({ error: error.message, code: error.code });
    return true;
  }

  return false;
};

export { mapDatavizHttpErrors };
