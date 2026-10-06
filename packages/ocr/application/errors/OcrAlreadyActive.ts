import { DomainError } from '#api/core/domain/error/DomainError.js';

/** The file already has an OCR record: one in progress, or one that already produced a result. */
class OcrAlreadyActive extends DomainError {
  static readonly category = 'conflict';

  constructor(filename: string) {
    super(`The file "${filename}" already has an OCR task`, 'ocr.already_active');
  }
}

export { OcrAlreadyActive };
