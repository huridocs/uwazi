import { InvalidOcrTransition } from './errors/InvalidOcrTransition.js';
import { IdempotencyKey } from './IdempotencyKey.js';
import { OcrFailureReason } from './OcrFailureReason.js';
import { OcrStatus } from './OcrStatus.js';

type OcrRecordProps = {
  id: string;
  sourceFileId: string | null;
  filename: string;
  language: string;
  status: OcrStatus;
  attempt: number;
  requestedAt?: number;
  lastUpdated: number;
  resultFileId?: string;
  failureReason?: OcrFailureReason;
};

/** Whether a result was taken, or discarded as stale or duplicate. */
type OcrResultOutcome = 'applied' | 'ignored';

/**
 * The OCR of one source PDF file, from request to its result file.
 *
 * queued → processing → ready | failed; `requeue()` returns processing to queued when the service
 * lost the result, and `retry()` returns failed to queued. Each submission starts a new attempt,
 * and only a result carrying the current attempt's key while processing is taken — anything else
 * is reported as ignored, never as an error, since duplicate and late results are expected from
 * the service.
 */
class OcrRecord {
  readonly id: string;

  readonly filename: string;

  readonly language: string;

  private _sourceFileId: string | null;

  private _status: OcrStatus;

  private _attempt: number;

  private _requestedAt?: number;

  private _lastUpdated: number;

  private _resultFileId?: string;

  private _failureReason?: OcrFailureReason;

  constructor(props: OcrRecordProps) {
    this.id = props.id;
    this._sourceFileId = props.sourceFileId;
    this.filename = props.filename;
    this.language = props.language;
    this._status = props.status;
    this._attempt = props.attempt;
    this._requestedAt = props.requestedAt;
    this._lastUpdated = props.lastUpdated;
    this._resultFileId = props.resultFileId;
    this._failureReason = props.failureReason;
  }

  static request(props: {
    id: string;
    sourceFileId: string | null;
    filename: string;
    language: string;
    now: number;
  }): OcrRecord {
    const { now, ...identity } = props;
    return new OcrRecord({ ...identity, status: OcrStatus.QUEUED, attempt: 0, lastUpdated: now });
  }

  get sourceFileId() {
    return this._sourceFileId;
  }

  get status() {
    return this._status;
  }

  get attempt() {
    return this._attempt;
  }

  get requestedAt() {
    return this._requestedAt;
  }

  get lastUpdated() {
    return this._lastUpdated;
  }

  get resultFileId() {
    return this._resultFileId;
  }

  get failureReason() {
    return this._failureReason;
  }

  retry(now: number): void {
    this.assertStatus(OcrStatus.FAILED, 'be retried');
    this._failureReason = undefined;
    this.moveTo(OcrStatus.QUEUED, now);
  }

  submit(now: number): IdempotencyKey {
    this.assertStatus(OcrStatus.QUEUED, 'be submitted');
    this._attempt += 1;
    this._requestedAt = now;
    this.moveTo(OcrStatus.PROCESSING, now);
    return IdempotencyKey.of(this.id, this._attempt);
  }

  requeue(now: number): void {
    this.assertStatus(OcrStatus.PROCESSING, 'be requeued');
    this.moveTo(OcrStatus.QUEUED, now);
  }

  accepts(key: IdempotencyKey): boolean {
    return (
      this._status === OcrStatus.PROCESSING && key.equals(IdempotencyKey.of(this.id, this._attempt))
    );
  }

  complete(key: IdempotencyKey, resultFileId: string, now: number): OcrResultOutcome {
    if (!this.accepts(key)) {
      return 'ignored';
    }
    this._resultFileId = resultFileId;
    this._failureReason = undefined;
    this.moveTo(OcrStatus.READY, now);
    return 'applied';
  }

  fail(key: IdempotencyKey, reason: OcrFailureReason, now: number): OcrResultOutcome {
    if (!this.accepts(key)) {
      return 'ignored';
    }
    this._failureReason = reason;
    this.moveTo(OcrStatus.FAILED, now);
    return 'applied';
  }

  failUnsent(reason: OcrFailureReason, now: number): void {
    this.assertStatus(OcrStatus.QUEUED, 'fail unsent');
    this._failureReason = reason;
    this.moveTo(OcrStatus.FAILED, now);
  }

  timeOut(now: number): void {
    this.assertStatus(OcrStatus.PROCESSING, 'time out');
    this._failureReason = OcrFailureReason.TIMEOUT;
    this.moveTo(OcrStatus.FAILED, now);
  }

  sourceRemoved(): void {
    this._sourceFileId = null;
  }

  isActive(): boolean {
    return this._status === OcrStatus.QUEUED || this._status === OcrStatus.PROCESSING;
  }

  private assertStatus(expected: OcrStatus, action: string) {
    if (this._status !== expected) {
      throw new InvalidOcrTransition(this.id, this._status, action);
    }
  }

  private moveTo(status: OcrStatus, now: number) {
    this._status = status;
    this._lastUpdated = now;
  }
}

export { OcrRecord };
export type { OcrRecordProps, OcrResultOutcome };
