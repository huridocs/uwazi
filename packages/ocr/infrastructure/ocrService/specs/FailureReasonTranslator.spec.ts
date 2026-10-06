import { OcrFailureReason } from '../../../domain/OcrFailureReason.js';
import { FailureReasonTranslator } from '../FailureReasonTranslator.js';

describe('FailureReasonTranslator', () => {
  it.each([
    ['The file does not appear to be a valid PDF', OcrFailureReason.INVALID_PDF],
    ['The PDF could not be found', OcrFailureReason.PDF_NOT_FOUND],
    ['An unexpected error occurred', OcrFailureReason.UNEXPECTED],
    ['Something the service never said before', OcrFailureReason.UNEXPECTED],
    [undefined, OcrFailureReason.UNEXPECTED],
    [null, OcrFailureReason.UNEXPECTED],
  ])('should translate the message %p', (message, reason) => {
    expect(FailureReasonTranslator.fromErrorMessage(message)).toBe(reason);
  });
});
