import { InvalidIdempotencyKey } from './errors/InvalidIdempotencyKey.js';

const SEPARATOR = ':';

/**
 * Identifies one attempt at segmenting one record. It travels to the segmentation service and
 * back, so a result can be matched to the attempt that produced it and a stale one ignored.
 *
 * Requests number their attempts from 1. Attempt 0 is the one a segmentation claimed by the old
 * dispatch loop is in: it predates keys, and its result arrives without one.
 */
class IdempotencyKey {
  readonly segmentationId: string;

  readonly attempt: number;

  private constructor(segmentationId: string, attempt: number) {
    this.segmentationId = segmentationId;
    this.attempt = attempt;
  }

  static of(segmentationId: string, attempt: number): IdempotencyKey {
    if (!IdempotencyKey.isValid(segmentationId, attempt)) {
      throw new InvalidIdempotencyKey(`${segmentationId}${SEPARATOR}${attempt}`);
    }
    return new IdempotencyKey(segmentationId, attempt);
  }

  static parse(raw: string): IdempotencyKey {
    const separatorAt = raw.lastIndexOf(SEPARATOR);
    const segmentationId = raw.slice(0, separatorAt);
    const attemptPart = raw.slice(separatorAt + 1);

    if (separatorAt === -1 || !/^\d+$/.test(attemptPart)) {
      throw new InvalidIdempotencyKey(raw);
    }

    const attempt = Number(attemptPart);
    if (!IdempotencyKey.isValid(segmentationId, attempt)) {
      throw new InvalidIdempotencyKey(raw);
    }
    return new IdempotencyKey(segmentationId, attempt);
  }

  equals(other: IdempotencyKey): boolean {
    return this.segmentationId === other.segmentationId && this.attempt === other.attempt;
  }

  toString(): string {
    return `${this.segmentationId}${SEPARATOR}${this.attempt}`;
  }

  private static isValid(segmentationId: string, attempt: number) {
    return (
      segmentationId.length > 0 &&
      !segmentationId.includes(SEPARATOR) &&
      Number.isInteger(attempt) &&
      attempt >= 0
    );
  }
}

export { IdempotencyKey };
