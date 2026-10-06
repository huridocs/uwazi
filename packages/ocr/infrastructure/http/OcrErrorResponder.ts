import type { Response } from 'express';
import { FileNotFound } from '#api/core/domain/files/errors.js';
import { FileIsNotADocument } from '../../application/errors/FileIsNotADocument.js';
import { OcrAlreadyActive } from '../../application/errors/OcrAlreadyActive.js';
import { OcrLanguageNotSupported } from '../../application/errors/OcrLanguageNotSupported.js';
import { OcrNotEnabled } from '../../application/errors/OcrNotEnabled.js';
import { OcrServiceUnavailable } from '../../application/errors/OcrServiceUnavailable.js';

const STATUS_BY_ERROR: [new (...args: never[]) => Error, number][] = [
  [OcrNotEnabled, 404],
  [FileNotFound, 404],
  [FileIsNotADocument, 400],
  [OcrAlreadyActive, 409],
  [OcrLanguageNotSupported, 422],
  [OcrServiceUnavailable, 503],
];

/** Maps the errors the OCR use cases raise to the statuses the endpoints have always answered. */
class OcrErrorResponder {
  /** Answers the request when the error is an expected one; returns whether it did. */
  static respond(response: Response, error: unknown): boolean {
    const match = STATUS_BY_ERROR.find(([ErrorClass]) => error instanceof ErrorClass);
    if (!match) {
      return false;
    }
    response.status(match[1]).json({ error: (error as Error).message });
    return true;
  }
}

export { OcrErrorResponder };
