import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { InvalidOcrTransition } from './errors/InvalidOcrTransition.js';
import { IdempotencyKey } from './IdempotencyKey.js';
import { OcrFailureReason } from './OcrFailureReason.js';
import { OcrStatus } from './OcrStatus.js';

type OcrRecordProps = {
  id: string;
  sourceFileId: string | null;
  filename: string;
  language: LanguageISO6391;
  status: OcrStatus;
  attempt: number;
  requestedAt?: number;
  lastUpdated: number;
  resultFileId?: string;
  failureReason?: OcrFailureReason;
};

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

  readonly language: LanguageISO6391;

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
    language: LanguageISO6391;
  }): OcrRecord {
    return new OcrRecord({
      ...props,
      status: OcrStatus.QUEUED,
      attempt: 0,
      lastUpdated: Date.now(),
    });
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

  retry(): void {
    this.assertStatus(OcrStatus.FAILED, 'be retried');
    this._failureReason = undefined;
    this.moveTo(OcrStatus.QUEUED);
  }

  submit(): IdempotencyKey {
    this.assertStatus(OcrStatus.QUEUED, 'be submitted');
    this._attempt += 1;
    this.moveTo(OcrStatus.PROCESSING);
    this._requestedAt = this._lastUpdated;
    return IdempotencyKey.of(this.id, this._attempt);
  }

  requeue(): void {
    this.assertStatus(OcrStatus.PROCESSING, 'be requeued');
    this.moveTo(OcrStatus.QUEUED);
  }

  accepts(key: IdempotencyKey): boolean {
    return (
      this._status === OcrStatus.PROCESSING && key.equals(IdempotencyKey.of(this.id, this._attempt))
    );
  }

  complete(key: IdempotencyKey, resultFileId: string): OcrResultOutcome {
    if (!this.accepts(key)) {
      return 'ignored';
    }
    this._resultFileId = resultFileId;
    this._failureReason = undefined;
    this.moveTo(OcrStatus.READY);
    return 'applied';
  }

  fail(key: IdempotencyKey, reason: OcrFailureReason): OcrResultOutcome {
    if (!this.accepts(key)) {
      return 'ignored';
    }
    this._failureReason = reason;
    this.moveTo(OcrStatus.FAILED);
    return 'applied';
  }

  failUnsent(reason: OcrFailureReason): void {
    this.assertStatus(OcrStatus.QUEUED, 'fail unsent');
    this._failureReason = reason;
    this.moveTo(OcrStatus.FAILED);
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

  private moveTo(status: OcrStatus) {
    this._status = status;
    this._lastUpdated = Date.now();
  }
}

export { OcrRecord };
export type { OcrRecordProps, OcrResultOutcome };
