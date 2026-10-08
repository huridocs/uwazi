import { DomainError } from '#api/core/domain/error/DomainError.js';
import { OcrStatus } from '../OcrStatus.js';

class InvalidOcrTransition extends DomainError {
  static readonly category = 'conflict';

  constructor(recordId: string, from: OcrStatus, action: string) {
    super(`Ocr record "${recordId}" cannot ${action} while ${from}`, 'ocr.invalid_transition');
  }
}

export { InvalidOcrTransition };
