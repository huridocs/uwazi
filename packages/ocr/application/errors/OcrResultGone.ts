import { DomainError } from '#api/core/domain/error/DomainError.js';

/**
 * The service no longer holds the result: it hands each one out once, so a result already fetched,
 * or lost on its side, is gone. Requesting the OCR again is the way forward.
 */
class OcrResultGone extends DomainError {
  static readonly category = 'not_found';

  constructor(cause?: Error) {
    super('The OCR result is no longer available', 'ocr.result_gone', cause);
  }
}

export { OcrResultGone };
