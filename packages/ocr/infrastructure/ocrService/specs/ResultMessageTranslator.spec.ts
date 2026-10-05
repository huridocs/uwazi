import { MalformedOcrResult } from '../../../application/errors/MalformedOcrResult.js';
import { IdempotencyKey } from '../../../domain/IdempotencyKey.js';
import { OcrFailureReason } from '../../../domain/OcrFailureReason.js';
import { ResultMessageTranslator } from '../ResultMessageTranslator.js';

const success = {
  tenant: 'tenant',
  task: 'ocr',
  params: { filename: 'file.pdf', language: 'en', metadata: { key: 'rec1:2' } },
  success: true,
  error_message: null,
  file_url: 'http://service/ocr_results/tenant/file.pdf',
};

const failure = (errorMessage?: string | null) => ({
  ...success,
  success: false,
  error_message: errorMessage,
  file_url: null,
});

describe('ResultMessageTranslator', () => {
  it('should translate a success into an outcome carrying the key and an opaque handle', () => {
    expect(ResultMessageTranslator.toOutcome(success)).toEqual({
      tenant: 'tenant',
      outcome: {
        filename: 'file.pdf',
        key: IdempotencyKey.of('rec1', 2),
        succeeded: true,
        handle: expect.any(Object),
      },
    });
  });

  it('should leave the key out when the service did not echo the metadata', () => {
    const { metadata: _metadata, ...params } = success.params;

    const { outcome } = ResultMessageTranslator.toOutcome({ ...success, params });

    expect(outcome.key).toBeUndefined();
    expect(outcome.succeeded).toBe(true);
  });

  it('should leave the key out when the metadata carries none', () => {
    const params = { ...success.params, metadata: {} };

    expect(ResultMessageTranslator.toOutcome({ ...success, params }).outcome.key).toBeUndefined();
  });

  it.each([
    ['The file does not appear to be a valid PDF', OcrFailureReason.INVALID_PDF],
    ['The PDF could not be found', OcrFailureReason.PDF_NOT_FOUND],
    ['Something the service never said before', OcrFailureReason.UNEXPECTED],
    [undefined, OcrFailureReason.UNEXPECTED],
  ])('should translate the failure "%s"', (errorMessage, reason) => {
    expect(ResultMessageTranslator.toOutcome(failure(errorMessage)).outcome).toEqual({
      filename: 'file.pdf',
      key: IdempotencyKey.of('rec1', 2),
      succeeded: false,
      reason,
    });
  });

  it.each([
    ['a message that is not an object', 'nope'],
    ['a message without tenant', { ...success, tenant: undefined }],
    ['a message without filename', { ...success, params: {} }],
    ['a success without file url', { ...success, file_url: null }],
    [
      'an invalid idempotency key',
      { ...success, params: { filename: 'f.pdf', metadata: { key: 'nope' } } },
    ],
  ])('should reject %s as malformed', (_case, message) => {
    expect(() => ResultMessageTranslator.toOutcome(message)).toThrow(MalformedOcrResult);
  });
});
