import { OcrOutcome } from '../../application/contracts/OcrEngine.js';
import { MalformedOcrResult } from '../../application/errors/MalformedOcrResult.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { FailureReasonTranslator } from './FailureReasonTranslator.js';
import { WireOutcomeHandle, WireResultMessage, WireResultMessageSchema } from './wireTypes.js';

/**
 * A message from the results queue into the tenant it belongs to and what happened. The result
 * url goes into an opaque handle; only `RemoteOcrEngine` reads it back.
 */
class ResultMessageTranslator {
  static toOutcome(raw: unknown): { tenant: string; outcome: OcrOutcome } {
    const parsed = WireResultMessageSchema.safeParse(raw);
    if (!parsed.success) {
      throw new MalformedOcrResult('unexpected result message', parsed.error);
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
        : {
            ...identity,
            succeeded: false,
            reason: FailureReasonTranslator.fromErrorMessage(message.error_message),
          },
    };
  }

  private static keyOf(message: WireResultMessage) {
    const raw = message.params.metadata?.key;
    if (raw === undefined) {
      return undefined;
    }
    try {
      return IdempotencyKey.parse(raw);
    } catch (error) {
      throw new MalformedOcrResult(`invalid idempotency key "${raw}"`, error);
    }
  }

  private static handleOf(message: WireResultMessage): WireOutcomeHandle {
    if (!message.file_url) {
      throw new MalformedOcrResult('a success without a result url');
    }
    return { fileUrl: message.file_url };
  }
}

export { ResultMessageTranslator };
