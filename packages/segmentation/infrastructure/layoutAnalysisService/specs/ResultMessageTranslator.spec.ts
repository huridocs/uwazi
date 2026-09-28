import { IdempotencyKey } from '../../../domain/IdempotencyKey.js';
import { SegmentationFailureReason } from '../../../domain/SegmentationFailureReason.js';
import { MalformedSegmentationResult } from '../../../application/errors/MalformedSegmentationResult.js';
import { ResultMessageTranslator } from '../ResultMessageTranslator.js';

const success = {
  tenant: 'tenant',
  task: 'segmentation',
  params: { filename: 'file.pdf', idempotency_key: 'seg1:2', language: 'en' },
  success: true,
  error_message: null,
  data_url: 'http://service/get_paragraphs/tenant/file.pdf',
  file_url: 'http://service/get_xml/tenant__file.xml',
};

const failure = (errorMessage: string) => ({
  ...success,
  success: false,
  error_message: errorMessage,
  data_url: null,
  file_url: null,
});

describe('ResultMessageTranslator', () => {
  it('should translate a success into an outcome carrying the key and an opaque handle', () => {
    expect(ResultMessageTranslator.toOutcome(success)).toEqual({
      tenant: 'tenant',
      outcome: {
        filename: 'file.pdf',
        key: IdempotencyKey.of('seg1', 2),
        succeeded: true,
        handle: expect.any(Object),
      },
    });
  });

  it('should leave the key out when the service did not echo one', () => {
    const { idempotency_key: _key, ...params } = success.params;

    expect(ResultMessageTranslator.toOutcome({ ...success, params }).outcome.key).toBeUndefined();
  });

  it.each([
    ['The file does not appear to be a valid PDF', SegmentationFailureReason.NOT_A_PDF],
    ['The PDF could not be found', SegmentationFailureReason.PDF_MISSING],
    ['An unexpected error occurred', SegmentationFailureReason.UNEXPECTED],
    ['Something the service never said before', SegmentationFailureReason.UNEXPECTED],
  ])('should translate the failure "%s"', (errorMessage, reason) => {
    expect(ResultMessageTranslator.toOutcome(failure(errorMessage)).outcome).toEqual({
      filename: 'file.pdf',
      key: IdempotencyKey.of('seg1', 2),
      succeeded: false,
      reason,
    });
  });

  it('should treat a failure without a message as unexpected', () => {
    expect(
      ResultMessageTranslator.toOutcome({ ...failure('x'), error_message: undefined }).outcome
    ).toMatchObject({
      succeeded: false,
      reason: SegmentationFailureReason.UNEXPECTED,
    });
  });

  it.each([
    ['a message that is not an object', 'nope'],
    ['a message without tenant', { ...success, tenant: undefined }],
    ['a message without filename', { ...success, params: {} }],
    ['a success without data url', { ...success, data_url: null }],
    ['a success without file url', { ...success, file_url: undefined }],
    [
      'an invalid idempotency key',
      { ...success, params: { filename: 'f.pdf', idempotency_key: 'nope' } },
    ],
  ])('should reject %s as malformed', (_case, message) => {
    expect(() => ResultMessageTranslator.toOutcome(message)).toThrow(MalformedSegmentationResult);
  });
});
