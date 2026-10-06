import { OcrOutcome } from '../../application/contracts/OcrEngine.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { OcrFailureReason } from '../../domain/OcrFailureReason.js';

type OutcomeParams = {
  filename: string;
  key?: string;
  succeeded: boolean;
  handle?: Record<string, string>;
  reason?: string;
};

/** An outcome as plain job params, and back. */
class OcrOutcomeParams {
  static from(outcome: OcrOutcome): OutcomeParams {
    return {
      filename: outcome.filename,
      ...(outcome.key && { key: outcome.key.toString() }),
      succeeded: outcome.succeeded,
      ...(outcome.succeeded ? { handle: { ...outcome.handle } } : { reason: outcome.reason }),
    };
  }

  static toOutcome(params: OutcomeParams): OcrOutcome {
    const identity = {
      filename: params.filename,
      key: params.key === undefined ? undefined : IdempotencyKey.parse(params.key),
    };
    return params.succeeded
      ? { ...identity, succeeded: true, handle: params.handle ?? {} }
      : { ...identity, succeeded: false, reason: params.reason as OcrFailureReason };
  }
}

export { OcrOutcomeParams };
export type { OutcomeParams };
