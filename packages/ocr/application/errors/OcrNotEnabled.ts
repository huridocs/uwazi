import { DomainError } from '#api/core/domain/error/DomainError.js';

class OcrNotEnabled extends DomainError {
  static readonly category = 'not_found';

  constructor() {
    super('OCR is not enabled', 'ocr.not_enabled');
  }
}

export { OcrNotEnabled };
