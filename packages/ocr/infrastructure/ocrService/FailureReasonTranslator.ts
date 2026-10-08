import { OcrFailureReason } from '../../domain/OcrFailureReason.js';

/** The service's fixed failure messages. Anything else, or none, is unexpected. */
const REASON_BY_ERROR_MESSAGE: Record<string, OcrFailureReason> = {
  'The file does not appear to be a valid PDF': OcrFailureReason.INVALID_PDF,
  'The PDF could not be found': OcrFailureReason.PDF_NOT_FOUND,
};

class FailureReasonTranslator {
  static fromErrorMessage(message?: string | null): OcrFailureReason {
    return REASON_BY_ERROR_MESSAGE[message ?? ''] ?? OcrFailureReason.UNEXPECTED;
  }
}

export { FailureReasonTranslator };
