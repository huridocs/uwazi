import { IdempotencyKey } from '../IdempotencyKey.js';
import { OcrFailureReason } from '../OcrFailureReason.js';
import { OcrRecord, OcrRecordProps } from '../OcrRecord.js';
import { OcrStatus } from '../OcrStatus.js';
import { InvalidOcrTransition } from '../errors/InvalidOcrTransition.js';

const NOW = 1_700_000_000_000;
const LATER = NOW + 1000;

const identity = { id: 'rec1', sourceFileId: 'file1', filename: 'scan.pdf', language: 'eng' };

const load = (overrides: Partial<OcrRecordProps>) =>
  new OcrRecord({
    ...identity,
    status: OcrStatus.QUEUED,
    attempt: 0,
    lastUpdated: NOW,
    ...overrides,
  });

const processing = (attempt = 1) =>
  load({ status: OcrStatus.PROCESSING, attempt, requestedAt: NOW });

const keyFor = (attempt: number) => IdempotencyKey.of('rec1', attempt);

const statusesExcept = (...allowed: OcrStatus[]) =>
  Object.values(OcrStatus).filter(status => !allowed.includes(status));

describe('OcrRecord', () => {
  describe('request()', () => {
    it('should start queued, with no attempt and no result', () => {
      const record = OcrRecord.request({ ...identity, now: NOW });

      expect(record).toMatchObject({
        ...identity,
        status: OcrStatus.QUEUED,
        attempt: 0,
        lastUpdated: NOW,
      });
      expect(record.requestedAt).toBeUndefined();
      expect(record.resultFileId).toBeUndefined();
      expect(record.failureReason).toBeUndefined();
      expect(record.isActive()).toBe(true);
    });
  });

  describe('submit()', () => {
    it('should start a new attempt and return its key', () => {
      const record = load({ status: OcrStatus.QUEUED, attempt: 2 });

      const key = record.submit(LATER);

      expect(key.equals(keyFor(3))).toBe(true);
      expect(record).toMatchObject({
        status: OcrStatus.PROCESSING,
        attempt: 3,
        requestedAt: LATER,
        lastUpdated: LATER,
      });
    });

    it.each(statusesExcept(OcrStatus.QUEUED))('should refuse to submit a %s record', status => {
      expect(() => load({ status }).submit(LATER)).toThrow(InvalidOcrTransition);
    });
  });

  describe('retry()', () => {
    it('should move a failed record back to queued and clear the failure', () => {
      const record = load({
        status: OcrStatus.FAILED,
        attempt: 1,
        failureReason: OcrFailureReason.UNEXPECTED,
      });

      record.retry(LATER);

      expect(record).toMatchObject({ status: OcrStatus.QUEUED, attempt: 1, lastUpdated: LATER });
      expect(record.failureReason).toBeUndefined();
    });

    it.each(statusesExcept(OcrStatus.FAILED))('should refuse to retry a %s record', status => {
      expect(() => load({ status }).retry(LATER)).toThrow(InvalidOcrTransition);
    });
  });

  describe('requeue()', () => {
    it('should move a processing record back to queued', () => {
      const record = processing(2);

      record.requeue(LATER);

      expect(record).toMatchObject({ status: OcrStatus.QUEUED, attempt: 2, lastUpdated: LATER });
    });

    it.each(statusesExcept(OcrStatus.PROCESSING))(
      'should refuse to requeue a %s record',
      status => {
        expect(() => load({ status }).requeue(LATER)).toThrow(InvalidOcrTransition);
      }
    );
  });

  describe('accepts()', () => {
    it('should accept the key of the current attempt while processing', () => {
      expect(processing(2).accepts(keyFor(2))).toBe(true);
    });

    it('should accept the attempt zero key of a record migrated while in flight', () => {
      expect(processing(0).accepts(keyFor(0))).toBe(true);
    });

    it('should not accept a key of another attempt or record', () => {
      expect(processing(2).accepts(keyFor(1))).toBe(false);
      expect(processing(2).accepts(IdempotencyKey.of('other', 2))).toBe(false);
    });

    it.each(statusesExcept(OcrStatus.PROCESSING))(
      'should not accept the current key while %s',
      status => {
        expect(load({ status, attempt: 2 }).accepts(keyFor(2))).toBe(false);
      }
    );
  });

  describe('complete()', () => {
    it('should store the result file and become ready', () => {
      const record = processing(2);

      expect(record.complete(keyFor(2), 'result1', LATER)).toBe('applied');
      expect(record).toMatchObject({
        status: OcrStatus.READY,
        resultFileId: 'result1',
        lastUpdated: LATER,
      });
      expect(record.isActive()).toBe(false);
    });

    it('should ignore a stale key', () => {
      const record = processing(2);

      expect(record.complete(keyFor(1), 'result1', LATER)).toBe('ignored');
      expect(record).toMatchObject({ status: OcrStatus.PROCESSING, lastUpdated: NOW });
      expect(record.resultFileId).toBeUndefined();
    });

    it('should ignore a duplicate result once ready', () => {
      const record = processing(1);
      record.complete(keyFor(1), 'result1', LATER);

      expect(record.complete(keyFor(1), 'result2', LATER + 1)).toBe('ignored');
      expect(record.resultFileId).toBe('result1');
      expect(record.lastUpdated).toBe(LATER);
    });
  });

  describe('fail()', () => {
    it('should record the reason and become failed', () => {
      const record = processing(1);

      expect(record.fail(keyFor(1), OcrFailureReason.INVALID_PDF, LATER)).toBe('applied');
      expect(record).toMatchObject({
        status: OcrStatus.FAILED,
        failureReason: OcrFailureReason.INVALID_PDF,
        lastUpdated: LATER,
      });
      expect(record.isActive()).toBe(false);
    });

    it('should ignore a stale key', () => {
      const record = processing(2);

      expect(record.fail(keyFor(1), OcrFailureReason.UNEXPECTED, LATER)).toBe('ignored');
      expect(record.status).toBe(OcrStatus.PROCESSING);
      expect(record.failureReason).toBeUndefined();
    });

    it('should ignore a result for a record that is not processing', () => {
      const record = load({ status: OcrStatus.READY, attempt: 1, resultFileId: 'result1' });

      expect(record.fail(keyFor(1), OcrFailureReason.UNEXPECTED, LATER)).toBe('ignored');
      expect(record.status).toBe(OcrStatus.READY);
    });
  });

  describe('failUnsent()', () => {
    it('should fail a queued record that never reached the service', () => {
      const record = load({ status: OcrStatus.QUEUED });

      record.failUnsent(OcrFailureReason.SERVICE_NOT_CONFIGURED, LATER);

      expect(record).toMatchObject({
        status: OcrStatus.FAILED,
        failureReason: OcrFailureReason.SERVICE_NOT_CONFIGURED,
        lastUpdated: LATER,
      });
    });

    it.each(statusesExcept(OcrStatus.QUEUED))('should refuse to fail a %s record', status => {
      expect(() => load({ status }).failUnsent(OcrFailureReason.UNEXPECTED, LATER)).toThrow(
        InvalidOcrTransition
      );
    });
  });

  describe('sourceRemoved()', () => {
    it.each(Object.values(OcrStatus))('should detach the source of a %s record', status => {
      const record = load({ status });

      record.sourceRemoved();

      expect(record.sourceFileId).toBeNull();
      expect(record.status).toBe(status);
    });
  });

  describe('isActive()', () => {
    it.each([
      [OcrStatus.QUEUED, true],
      [OcrStatus.PROCESSING, true],
      [OcrStatus.READY, false],
      [OcrStatus.FAILED, false],
    ])('should report a %s record as %s', (status, expected) => {
      expect(load({ status }).isActive()).toBe(expected);
    });
  });
});
