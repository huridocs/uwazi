import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The OCR service could not be reached, or failed on its side. Worth retrying. */
class OcrServiceUnavailable extends DomainError {
  constructor(cause?: Error) {
    super('The OCR service is unavailable', 'ocr.service_unavailable', cause);
  }
}

export { OcrServiceUnavailable };
