import type { Response } from 'express';
import { EntityNotFoundError } from '#api/core/domain/entity/errors.js';

function sendNotFoundRows(response: Response, error: unknown): void {
  if (error instanceof EntityNotFoundError) {
    response.status(404).json({ rows: [] });
    return;
  }
  throw error;
}

export { sendNotFoundRows };
