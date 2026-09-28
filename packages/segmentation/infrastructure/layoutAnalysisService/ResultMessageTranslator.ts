import { SegmentationOutcome } from '../../application/contracts/SegmentationOutcome.js';
import { MalformedSegmentationResult } from '../../application/errors/MalformedSegmentationResult.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { SegmentationFailureReason } from '../../domain/SegmentationFailureReason.js';
import { WireOutcomeHandle, WireResultMessage, WireResultMessageSchema } from './wireTypes.js';

/** The service's fixed failure messages. Anything else, or none, is unexpected. */
const REASON_BY_ERROR_MESSAGE: Record<string, SegmentationFailureReason> = {
  'The file does not appear to be a valid PDF': SegmentationFailureReason.NOT_A_PDF,
  'The PDF could not be found': SegmentationFailureReason.PDF_MISSING,
};

/**
 * A message from the results queue into the tenant it belongs to and what happened. The result
 * urls go into an opaque handle; only `RemotePdfSegmenter` reads them back.
 */
class ResultMessageTranslator {
  static toOutcome(raw: unknown): { tenant: string; outcome: SegmentationOutcome } {
    const parsed = WireResultMessageSchema.safeParse(raw);
    if (!parsed.success) {
      throw new MalformedSegmentationResult('unexpected result message', parsed.error);
    }
    const message = parsed.data;
    const identity = {
      filename: message.params.filename,
      key: ResultMessageTranslator.keyOf(message),
    };

    return {
      tenant: message.tenant,
      outcome: message.success
        ? { ...identity, succeeded: true, handle: ResultMessageTranslator.handleOf(message) }
        : { ...identity, succeeded: false, reason: ResultMessageTranslator.reasonOf(message) },
    };
  }

  private static keyOf(message: WireResultMessage) {
    const raw = message.params.idempotency_key;
    if (raw === undefined) {
      return undefined;
    }
    try {
      return IdempotencyKey.parse(raw);
    } catch (error) {
      throw new MalformedSegmentationResult(`invalid idempotency key "${raw}"`, error);
    }
  }

  private static handleOf(message: WireResultMessage): WireOutcomeHandle {
    if (!message.data_url || !message.file_url) {
      throw new MalformedSegmentationResult('a success without result urls');
    }
    return { dataUrl: message.data_url, fileUrl: message.file_url };
  }

  private static reasonOf(message: WireResultMessage) {
    return (
      REASON_BY_ERROR_MESSAGE[message.error_message ?? ''] ?? SegmentationFailureReason.UNEXPECTED
    );
  }
}

export { ResultMessageTranslator };
