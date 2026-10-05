import { DomainError } from '#api/core/domain/error/DomainError.js';

class OcrServiceNotConfigured extends DomainError {
  constructor() {
    super('The OCR feature has no service url configured', 'ocr.service_not_configured');
  }
}

export { OcrServiceNotConfigured };
