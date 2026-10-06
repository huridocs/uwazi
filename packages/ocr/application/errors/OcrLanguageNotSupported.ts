import { DomainError } from '#api/core/domain/error/DomainError.js';

class OcrLanguageNotSupported extends DomainError {
  static readonly category = 'validation';

  constructor(language: string | undefined) {
    super(
      `The OCR service does not support the language "${language ?? 'none'}"`,
      'ocr.language_not_supported'
    );
  }
}

export { OcrLanguageNotSupported };
