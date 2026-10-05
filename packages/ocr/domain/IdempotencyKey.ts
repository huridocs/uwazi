import { InvalidIdempotencyKey } from './errors/InvalidIdempotencyKey.js';

const SEPARATOR = ':';

/**
 * Identifies one attempt at running OCR for one record. It travels to the OCR service and back,
 * so a result can be matched to the attempt that produced it and a stale one ignored.
 *
 * Submissions number their attempts from 1. Attempt 0 is the one a record migrated while in
 * flight is in: it predates keys, and its result arrives without one.
 */
class IdempotencyKey {
  readonly recordId: string;

  readonly attempt: number;

  private constructor(recordId: string, attempt: number) {
    this.recordId = recordId;
    this.attempt = attempt;
  }

  static of(recordId: string, attempt: number): IdempotencyKey {
    if (!IdempotencyKey.isValid(recordId, attempt)) {
      throw new InvalidIdempotencyKey(`${recordId}${SEPARATOR}${attempt}`);
    }
    return new IdempotencyKey(recordId, attempt);
  }

  static parse(raw: string): IdempotencyKey {
    const separatorAt = raw.lastIndexOf(SEPARATOR);
    const recordId = raw.slice(0, separatorAt);
    const attemptPart = raw.slice(separatorAt + 1);

    if (separatorAt === -1 || !/^\d+$/.test(attemptPart)) {
      throw new InvalidIdempotencyKey(raw);
    }

    const attempt = Number(attemptPart);
    if (!IdempotencyKey.isValid(recordId, attempt)) {
      throw new InvalidIdempotencyKey(raw);
    }
    return new IdempotencyKey(recordId, attempt);
  }

  equals(other: IdempotencyKey): boolean {
    return this.recordId === other.recordId && this.attempt === other.attempt;
  }

  toString(): string {
    return `${this.recordId}${SEPARATOR}${this.attempt}`;
  }

  private static isValid(recordId: string, attempt: number) {
    return (
      recordId.length > 0 &&
      !recordId.includes(SEPARATOR) &&
      Number.isInteger(attempt) &&
      attempt >= 0
    );
  }
}

export { IdempotencyKey };
