// eslint-disable-next-line no-restricted-imports
import { readFile } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { PdfSegmenter, OutcomeHandle, SegmentationOutcome } from '../contracts/PdfSegmenter.js';
import { MalformedSegmentationResult } from '../errors/MalformedSegmentationResult.js';
import { SegmentationResultGone } from '../errors/SegmentationResultGone.js';
import { SegmentationServiceUnavailable } from '../errors/SegmentationServiceUnavailable.js';
import { DocumentLayout } from '../../domain/DocumentLayout.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { LayoutSegment } from '../../domain/LayoutSegment.js';
import { SegmentationFailureReason } from '../../domain/SegmentationFailureReason.js';
import { SegmentType } from '../../domain/SegmentType.js';
import { SaveSegmentationResultFactory } from '../../infrastructure/factories/SaveSegmentationResultFactory.js';
import {
  f,
  idle,
  withSegmentations,
  useBackend,
  setUpBackends,
  requestedSegmentationIds,
  testConfigs,
} from './SegmentationIntakeFixtures.js';

const layout = new DocumentLayout({
  pages: [{ number: 1, width: 612, height: 792 }],
  segments: [
    new LayoutSegment({
      left: 1,
      top: 2,
      width: 3,
      height: 4,
      pageNumber: 1,
      text: 'Title',
      type: SegmentType.TITLE,
    }),
  ],
});

class FakePdfSegmenter implements PdfSegmenter {
  fetched: OutcomeHandle[] = [];

  failWith: Error | undefined;

  async submit() {
    throw new Error('not used here');
  }

  async backlogSize() {
    return 0;
  }

  async fetchLayout(handle: OutcomeHandle) {
    this.fetched.push(handle);
    if (this.failWith) {
      throw this.failWith;
    }
    return { layout, xml: Readable.from(['<pdf2xml/>']) };
  }
}

const processing = (attempt: number) => ({
  ...idle('doc'),
  filename: 'document.pdf',
  status: 'processing',
  attempt,
  requestedAt: 1000,
});

const handle = { dataUrl: 'data', fileUrl: 'file' };

const succeeded = (key?: IdempotencyKey): SegmentationOutcome => ({
  key,
  filename: 'document.pdf',
  succeeded: true,
  handle,
});

const stored = async (postgresCore: boolean) => {
  if (postgresCore) {
    const [row] = await testingEnvironment.pg.getAllFrom('segmentations');
    return {
      status: row.status,
      attempt: Number(row.attempt),
      xmlFilename: row.xml_filename ?? undefined,
      failureReason: row.failure_reason ?? undefined,
      segments: (row.layout as { segments?: unknown[] } | undefined)?.segments?.length,
    };
  }
  const [doc] = await testingEnvironment.db.getAllFrom('segmentations');
  return {
    status: doc.status,
    attempt: doc.attempt,
    xmlFilename: doc.xmlname,
    failureReason: doc.failureReason,
    segments: doc.segmentation?.paragraphs?.length,
  };
};

const storedXml = async (name: string) =>
  readFile(path.join(testingTenants.current().uploadedDocuments, 'segmentation', name), 'utf8');

describe('SaveSegmentationResult', () => {
  let segmenter: FakePdfSegmenter;

  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    const setUp = async (segmentation: object) => {
      // Resets the tenant's feature flags, so it has to come before useBackend.
      await testingEnvironment.setupTenantTmpPaths([]);
      useBackend(postgresCore);
      await testingEnvironment.setFixtures(withSegmentations(true, [segmentation]));
      await testingEnvironment.jobs.clear();
      segmenter = new FakePdfSegmenter();
    };

    const execute = async (outcome: SegmentationOutcome) =>
      testingEnvironment.runWithContext(async () =>
        SaveSegmentationResultFactory.default({ pdfSegmenter: segmenter }).execute(outcome)
      );

    it('should store the layout and its xml, and mark the segmentation ready', async () => {
      await setUp(processing(2));

      await execute(succeeded(IdempotencyKey.of(f.idString('doc'), 2)));

      expect(segmenter.fetched).toEqual([handle]);
      expect(await stored(postgresCore)).toEqual({
        status: 'ready',
        attempt: 2,
        xmlFilename: 'document.xml',
        failureReason: undefined,
        segments: 1,
      });
      expect(await storedXml('document.xml')).toBe('<pdf2xml/>');
    });

    it('should ignore the result of a previous attempt without fetching it', async () => {
      await setUp(processing(2));

      await execute(succeeded(IdempotencyKey.of(f.idString('doc'), 1)));

      expect(segmenter.fetched).toEqual([]);
      expect(await stored(postgresCore)).toMatchObject({ status: 'processing', attempt: 2 });
    });

    it('should ignore a duplicate of a result already taken', async () => {
      await setUp({ ...processing(2), status: 'ready' });

      await execute(succeeded(IdempotencyKey.of(f.idString('doc'), 2)));

      expect(segmenter.fetched).toEqual([]);
    });

    it('should record a failure the service reported', async () => {
      await setUp(processing(1));

      await execute({
        key: IdempotencyKey.of(f.idString('doc'), 1),
        filename: 'document.pdf',
        succeeded: false,
        reason: SegmentationFailureReason.NOT_A_PDF,
      });

      expect(await stored(postgresCore)).toMatchObject({
        status: 'failed',
        failureReason: SegmentationFailureReason.NOT_A_PDF,
      });
    });

    it('should take a result without a key as the current attempt, found by filename', async () => {
      await setUp(processing(0));

      await execute(succeeded());

      expect(await stored(postgresCore)).toMatchObject({ status: 'ready', attempt: 0 });
    });

    it('should ignore a result without a key for a segmentation not processing', async () => {
      await setUp({ ...processing(0), status: 'idle' });

      await execute(succeeded());

      expect(segmenter.fetched).toEqual([]);
      expect(await stored(postgresCore)).toMatchObject({ status: 'idle' });
    });

    it('should ignore a result for a segmentation that no longer exists', async () => {
      await setUp(processing(1));

      await execute(succeeded(IdempotencyKey.of(f.idString('gone'), 1)));

      expect(segmenter.fetched).toEqual([]);
    });

    it('should request the segmentation again when its result is gone', async () => {
      await setUp(processing(1));
      segmenter.failWith = new SegmentationResultGone();

      await execute(succeeded(IdempotencyKey.of(f.idString('doc'), 1)));

      expect(await stored(postgresCore)).toMatchObject({ status: 'queued', attempt: 1 });
      expect(await requestedSegmentationIds(postgresCore)).toEqual([f.idString('doc')]);
    });

    it('should fail the segmentation when its result cannot be understood', async () => {
      await setUp(processing(1));
      segmenter.failWith = new MalformedSegmentationResult('nonsense');

      await execute(succeeded(IdempotencyKey.of(f.idString('doc'), 1)));

      expect(await stored(postgresCore)).toMatchObject({
        status: 'failed',
        failureReason: SegmentationFailureReason.UNEXPECTED,
      });
    });

    it('should let an unavailable service fail the job, leaving it processing', async () => {
      await setUp(processing(1));
      segmenter.failWith = new SegmentationServiceUnavailable();

      await expect(
        execute(succeeded(IdempotencyKey.of(f.idString('doc'), 1)))
      ).rejects.toBeInstanceOf(SegmentationServiceUnavailable);
      expect(await stored(postgresCore)).toMatchObject({ status: 'processing' });
    });
  });
});
