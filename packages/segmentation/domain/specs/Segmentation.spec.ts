import { DocumentLayout } from '../DocumentLayout.js';
import { IdempotencyKey } from '../IdempotencyKey.js';
import { Segmentation, SegmentationProps } from '../Segmentation.js';
import { SegmentationFailureReason } from '../SegmentationFailureReason.js';
import { SegmentationStatus } from '../SegmentationStatus.js';
import { InvalidSegmentationTransition } from '../errors/InvalidSegmentationTransition.js';

const NOW = 1_700_000_000_000;

const layout = new DocumentLayout({
  pages: [{ number: 1, width: 612, height: 792 }],
  segments: [],
});

const identity = { id: 'seg1', fileId: 'file1', filename: 'document.pdf' };

const load = (overrides: Partial<SegmentationProps>) =>
  new Segmentation({ ...identity, status: SegmentationStatus.IDLE, attempt: 0, ...overrides });

const processing = (attempt = 1) =>
  load({ status: SegmentationStatus.PROCESSING, attempt, requestedAt: NOW });

describe('Segmentation', () => {
  describe('create()', () => {
    it('should start idle, with no attempt and no result', () => {
      const segmentation = Segmentation.create(identity);

      expect(segmentation).toMatchObject({
        ...identity,
        status: SegmentationStatus.IDLE,
        attempt: 0,
      });
      expect(segmentation.requestedAt).toBeUndefined();
      expect(segmentation.layout).toBeUndefined();
      expect(segmentation.xmlFilename).toBeUndefined();
      expect(segmentation.failureReason).toBeUndefined();
    });
  });

  describe('queue()', () => {
    it('should move an idle segmentation to queued', () => {
      const segmentation = Segmentation.create(identity);

      expect(segmentation.queue()).toBe(true);
      expect(segmentation.status).toBe(SegmentationStatus.QUEUED);
    });

    it.each([
      SegmentationStatus.QUEUED,
      SegmentationStatus.PROCESSING,
      SegmentationStatus.READY,
      SegmentationStatus.FAILED,
    ])('should leave a %s segmentation untouched and report it', status => {
      const segmentation = load({ status });

      expect(segmentation.queue()).toBe(false);
      expect(segmentation.status).toBe(status);
    });
  });

  describe('request()', () => {
    it('should start a new attempt and return its key', () => {
      const segmentation = load({ status: SegmentationStatus.QUEUED, attempt: 2 });

      const key = segmentation.request(NOW);

      expect(key.equals(IdempotencyKey.of('seg1', 3))).toBe(true);
      expect(segmentation).toMatchObject({
        status: SegmentationStatus.PROCESSING,
        attempt: 3,
        requestedAt: NOW,
      });
    });

    it.each([
      SegmentationStatus.IDLE,
      SegmentationStatus.PROCESSING,
      SegmentationStatus.READY,
      SegmentationStatus.FAILED,
    ])('should refuse to request a %s segmentation', status => {
      const segmentation = load({ status, attempt: 1 });

      expect(() => segmentation.request(NOW)).toThrow(InvalidSegmentationTransition);
      expect(segmentation.attempt).toBe(1);
    });
  });

  describe('accepts()', () => {
    it('should accept the key of the current attempt while processing', () => {
      expect(processing(2).accepts(IdempotencyKey.of('seg1', 2))).toBe(true);
    });

    it.each([
      ['a previous attempt', IdempotencyKey.of('seg1', 1)],
      ['another segmentation', IdempotencyKey.of('seg2', 2)],
    ])('should not accept the key of %s', (_case, key) => {
      expect(processing(2).accepts(key)).toBe(false);
    });

    it.each([
      SegmentationStatus.IDLE,
      SegmentationStatus.QUEUED,
      SegmentationStatus.READY,
      SegmentationStatus.FAILED,
    ])('should not accept any key when %s', status => {
      expect(load({ status, attempt: 2 }).accepts(IdempotencyKey.of('seg1', 2))).toBe(false);
    });
  });

  describe('a claim left by the dispatch loop before attempts were counted', () => {
    it('should accept a result for attempt zero while processing', () => {
      const segmentation = load({ status: SegmentationStatus.PROCESSING, attempt: 0 });

      expect(segmentation.complete(IdempotencyKey.of('seg1', 0), layout, 'document.xml')).toBe(
        'applied'
      );
    });
  });

  describe('complete()', () => {
    it('should store the layout and become ready', () => {
      const segmentation = processing();

      expect(segmentation.complete(IdempotencyKey.of('seg1', 1), layout, 'document.xml')).toBe(
        'applied'
      );
      expect(segmentation).toMatchObject({
        status: SegmentationStatus.READY,
        layout,
        xmlFilename: 'document.xml',
      });
    });

    it('should clear the reason of a previous failure', () => {
      const segmentation = load({
        status: SegmentationStatus.PROCESSING,
        attempt: 1,
        failureReason: SegmentationFailureReason.UNEXPECTED,
      });

      segmentation.complete(IdempotencyKey.of('seg1', 1), layout, 'document.xml');

      expect(segmentation.failureReason).toBeUndefined();
    });

    it('should ignore a stale result and change nothing', () => {
      const segmentation = processing(2);

      expect(segmentation.complete(IdempotencyKey.of('seg1', 1), layout, 'document.xml')).toBe(
        'ignored'
      );
      expect(segmentation.status).toBe(SegmentationStatus.PROCESSING);
      expect(segmentation.layout).toBeUndefined();
    });

    it('should ignore a duplicate result once ready', () => {
      const segmentation = processing();
      segmentation.complete(IdempotencyKey.of('seg1', 1), layout, 'document.xml');

      expect(segmentation.complete(IdempotencyKey.of('seg1', 1), layout, 'other.xml')).toBe(
        'ignored'
      );
      expect(segmentation.xmlFilename).toBe('document.xml');
    });
  });

  describe('fail()', () => {
    it('should record the reason and become failed', () => {
      const segmentation = processing();

      expect(
        segmentation.fail(IdempotencyKey.of('seg1', 1), SegmentationFailureReason.NOT_A_PDF)
      ).toBe('applied');
      expect(segmentation).toMatchObject({
        status: SegmentationStatus.FAILED,
        failureReason: SegmentationFailureReason.NOT_A_PDF,
      });
    });

    it('should ignore the failure of a previous attempt', () => {
      const segmentation = processing(2);

      expect(
        segmentation.fail(IdempotencyKey.of('seg1', 1), SegmentationFailureReason.UNEXPECTED)
      ).toBe('ignored');
      expect(segmentation.status).toBe(SegmentationStatus.PROCESSING);
      expect(segmentation.failureReason).toBeUndefined();
    });
  });

  describe('release()', () => {
    it.each([SegmentationStatus.QUEUED, SegmentationStatus.PROCESSING])(
      'should return a %s segmentation to idle, keeping its attempt count',
      status => {
        const segmentation = load({ status, attempt: 2, requestedAt: NOW });

        segmentation.release();

        expect(segmentation).toMatchObject({ status: SegmentationStatus.IDLE, attempt: 2 });
      }
    );

    it('should make the released attempt stale', () => {
      const segmentation = processing(2);

      segmentation.release();

      expect(segmentation.accepts(IdempotencyKey.of('seg1', 2))).toBe(false);
    });

    it('should be a no-op when already idle', () => {
      const segmentation = Segmentation.create(identity);

      segmentation.release();

      expect(segmentation.status).toBe(SegmentationStatus.IDLE);
    });

    it.each([SegmentationStatus.READY, SegmentationStatus.FAILED])(
      'should refuse to release a %s segmentation',
      status => {
        expect(() => load({ status }).release()).toThrow(InvalidSegmentationTransition);
      }
    );
  });
});
