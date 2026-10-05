import { DomainError } from '#api/core/domain/error/DomainError.js';

class OcrLanguageNotSupported extends DomainError {
  static readonly category = 'validation';

  constructor(language: string) {
    super(
      `The OCR service does not support the language "${language}"`,
      'ocr.language_not_supported'
    );
  }
}

export { OcrLanguageNotSupported };
