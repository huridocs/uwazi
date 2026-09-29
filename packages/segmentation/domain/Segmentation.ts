import { DocumentLayout } from './DocumentLayout.js';
import { InvalidSegmentationTransition } from './errors/InvalidSegmentationTransition.js';
import { IdempotencyKey } from './IdempotencyKey.js';
import { SegmentationFailureReason } from './SegmentationFailureReason.js';
import { SegmentationStatus } from './SegmentationStatus.js';

type SegmentationProps = {
  id: string;
  fileId: string;
  filename: string;
  status: SegmentationStatus;
  attempt: number;
  requestedAt?: number;
  layout?: DocumentLayout;
  xmlFilename?: string;
  failureReason?: SegmentationFailureReason;
};

/** Whether a result was taken, or discarded as stale or duplicate. */
type ResultOutcome = 'applied' | 'ignored';

/**
 * The segmentation of one PDF file, from registration to its layout.
 *
 * idle → queued → processing → ready | failed; `release()` returns queued or processing to idle.
 * Each request starts a new attempt, and only a result carrying the current attempt's key while
 * processing is taken — anything else is reported as ignored, never as an error, since duplicate
 * and late results are expected from the service.
 */
class Segmentation {
  readonly id: string;

  readonly fileId: string;

  readonly filename: string;

  private _status: SegmentationStatus;

  private _attempt: number;

  private _requestedAt?: number;

  private _layout?: DocumentLayout;

  private _xmlFilename?: string;

  private _failureReason?: SegmentationFailureReason;

  constructor(props: SegmentationProps) {
    this.id = props.id;
    this.fileId = props.fileId;
    this.filename = props.filename;
    this._status = props.status;
    this._attempt = props.attempt;
    this._requestedAt = props.requestedAt;
    this._layout = props.layout;
    this._xmlFilename = props.xmlFilename;
    this._failureReason = props.failureReason;
  }

  static create(props: { id: string; fileId: string; filename: string }): Segmentation {
    return new Segmentation({ ...props, status: SegmentationStatus.IDLE, attempt: 0 });
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

  get layout() {
    return this._layout;
  }

  get xmlFilename() {
    return this._xmlFilename;
  }

  get failureReason() {
    return this._failureReason;
  }

  /** Returns false, changing nothing, when the segmentation is not idle. */
  queue(): boolean {
    if (this._status !== SegmentationStatus.IDLE) {
      return false;
    }
    this._status = SegmentationStatus.QUEUED;
    return true;
  }

  request(now: number): IdempotencyKey {
    if (this._status !== SegmentationStatus.QUEUED) {
      throw new InvalidSegmentationTransition(this.id, this._status, 'be requested');
    }
    this._attempt += 1;
    this._requestedAt = now;
    this._status = SegmentationStatus.PROCESSING;
    return IdempotencyKey.of(this.id, this._attempt);
  }

  accepts(key: IdempotencyKey): boolean {
    return (
      this._status === SegmentationStatus.PROCESSING &&
      key.equals(IdempotencyKey.of(this.id, this._attempt))
    );
  }

  complete(key: IdempotencyKey, layout: DocumentLayout, xmlFilename: string): ResultOutcome {
    if (!this.accepts(key)) {
      return 'ignored';
    }
    this._layout = layout;
    this._xmlFilename = xmlFilename;
    this._failureReason = undefined;
    this._status = SegmentationStatus.READY;
    return 'applied';
  }

  fail(key: IdempotencyKey, reason: SegmentationFailureReason): ResultOutcome {
    if (!this.accepts(key)) {
      return 'ignored';
    }
    this._failureReason = reason;
    this._status = SegmentationStatus.FAILED;
    return 'applied';
  }

  release(): void {
    if (this._status === SegmentationStatus.IDLE) {
      return;
    }
    if (
      this._status !== SegmentationStatus.QUEUED &&
      this._status !== SegmentationStatus.PROCESSING
    ) {
      throw new InvalidSegmentationTransition(this.id, this._status, 'be released');
    }
    this._status = SegmentationStatus.IDLE;
  }
}

export { Segmentation };
export type { SegmentationProps, ResultOutcome };
