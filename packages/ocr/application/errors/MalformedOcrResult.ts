import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The OCR service sent something that cannot be understood. Retrying will not help. */
class MalformedOcrResult extends DomainError {
  static readonly category = 'validation';

  constructor(reason: string, cause?: Error) {
    super(`Malformed OCR result: ${reason}`, 'ocr.malformed_result', cause);
  }
}

export { MalformedOcrResult };
