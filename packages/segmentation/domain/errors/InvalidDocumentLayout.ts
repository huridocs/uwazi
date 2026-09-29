import { DomainError } from '#api/core/domain/error/DomainError.js';

class InvalidDocumentLayout extends DomainError {
  static readonly category = 'validation';

  constructor(reason: string) {
    super(`Invalid document layout: ${reason}`, 'segmentation.invalid_layout');
  }
}

export { InvalidDocumentLayout };
