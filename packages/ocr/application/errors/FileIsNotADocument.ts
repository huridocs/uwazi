import { DomainError } from '#api/core/domain/error/DomainError.js';

class FileIsNotADocument extends DomainError {
  static readonly category = 'validation';

  constructor(filename: string) {
    super(`The file "${filename}" is not a document`, 'ocr.file_is_not_a_document');
  }
}

export { FileIsNotADocument };
