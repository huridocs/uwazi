import { Readable } from 'stream';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { PdfSegmenter, SegmentationRequest } from '../contracts/PdfSegmenter.js';
import { SegmentationServiceNotConfigured } from '../errors/SegmentationServiceNotConfigured.js';
import { SegmentationServiceUnavailable } from '../errors/SegmentationServiceUnavailable.js';
import { DocumentLayout } from '../../domain/DocumentLayout.js';
import { RequestSegmentationFactory } from '../../infrastructure/factories/RequestSegmentationFactory.js';
import {
  f,
  idle,
  withSegmentations,
  useBackend,
  setUpBackends,
  testConfigs,
} from './SegmentationIntakeFixtures.js';

const NOW = 1_700_000_000_000;
const REQUEST_JOB = 'RequestSegmentationJobHandler';

class FakePdfSegmenter implements PdfSegmenter {
  submitted: SegmentationRequest[] = [];

  backlog = 0;

  failWith: Error | undefined;

  async submit(request: SegmentationRequest) {
    if (this.failWith) {
      throw this.failWith;
    }
    this.submitted.push(request);
  }

  async backlogSize() {
    return this.backlog;
  }

  async fetchLayout(): Promise<{ layout: DocumentLayout; xml: Readable }> {
    throw new Error('not used here');
  }
}

const queued = { ...idle('doc'), filename: 'english.pdf', status: 'queued' };

const stored = async (postgresCore: boolean) => {
  if (postgresCore) {
    const [row] = await testingEnvironment.pg.getAllFrom('segmentations');
    return {
      status: row.status,
      attempt: Number(row.attempt),
      requestedAt: row.requested_at && Number(row.requested_at),
    };
  }
  const [doc] = await testingEnvironment.db.getAllFrom('segmentations');
  return { status: doc.status, attempt: doc.attempt, requestedAt: doc.requestedAt };
};

const requestJobs = async (postgresCore: boolean) =>
  (await testingEnvironment.jobs.getAll({ postgresCore }))
    .filter(job => job.name === REQUEST_JOB)
    .map(job => ({
      params: typeof job.params === 'string' ? JSON.parse(job.params) : job.params,
      lockedUntil: Number(job.lockedUntil),
    }));

describe('RequestSegmentation', () => {
  let segmenter: FakePdfSegmenter;

  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    const setUp = async (segmentation: object, segmentationOn = true) => {
      // Resets the tenant's feature flags, so it has to come before useBackend.
      await testingEnvironment.setupTenantTmpPaths([{ filename: 'english.pdf', type: 'document' }]);
      useBackend(postgresCore);
      await testingEnvironment.setFixtures(withSegmentations(segmentationOn, [segmentation]));
      await testingEnvironment.jobs.clear();
      segmenter = new FakePdfSegmenter();
    };

    const execute = async (segmentationId = f.idString('doc')) =>
      testingEnvironment.runWithContext(async () =>
        RequestSegmentationFactory.default({ pdfSegmenter: segmenter, now: () => NOW }).execute({
          segmentationId,
        })
      );

    it('should send the PDF with the key of a new attempt, then mark it processing', async () => {
      await setUp(queued);

      await execute();

      expect(segmenter.submitted).toHaveLength(1);
      const [request] = segmenter.submitted;
      expect(request.key.toString()).toBe(`${f.idString('doc')}:1`);
      expect(request.filename).toBe('english.pdf');
      expect(request.content.subarray(0, 5).toString()).toBe('%PDF-');
      expect(await stored(postgresCore)).toEqual({
        status: 'processing',
        attempt: 1,
        requestedAt: NOW,
      });
    });

    it.each(['idle', 'processing', 'ready', 'failed'])(
      'should leave a %s segmentation alone',
      async status => {
        await setUp({ ...queued, status, attempt: 1 });

        await execute();

        expect(segmenter.submitted).toEqual([]);
        expect((await stored(postgresCore)).status).toBe(status);
      }
    );

    it('should do nothing for a segmentation that no longer exists', async () => {
      await setUp(queued);

      await execute(f.idString('gone'));

      expect(segmenter.submitted).toEqual([]);
    });

    it('should return the segmentation to idle when segmentation was switched off', async () => {
      await setUp(queued, false);

      await execute();

      expect(segmenter.submitted).toEqual([]);
      expect(await stored(postgresCore)).toMatchObject({ status: 'idle', attempt: 0 });
    });

    it('should return the segmentation to idle when the service has no url', async () => {
      await setUp(queued);
      segmenter.failWith = new SegmentationServiceNotConfigured();

      await execute();

      expect(await stored(postgresCore)).toMatchObject({ status: 'idle' });
    });

    describe.each([
      [
        'the service backlog is full',
        (s: FakePdfSegmenter) => {
          s.backlog = 10_000;
        },
      ],
      [
        'the service is unavailable',
        (s: FakePdfSegmenter) => {
          s.failWith = new SegmentationServiceUnavailable();
        },
      ],
    ])('when %s', (_case, arrange) => {
      it('should keep it queued and request it again later, without spending a retry', async () => {
        await setUp(queued);
        arrange(segmenter);

        await execute();

        expect(segmenter.submitted).toEqual([]);
        expect(await stored(postgresCore)).toMatchObject({ status: 'queued', attempt: 0 });
        const jobs = await requestJobs(postgresCore);
        expect(jobs).toEqual([
          {
            params: expect.objectContaining({ segmentationId: f.idString('doc') }),
            lockedUntil: expect.any(Number),
          },
        ]);
        expect(jobs[0].lockedUntil).toBeGreaterThan(Date.now());
      });
    });

    it('should let any other failure through, keeping it queued', async () => {
      await setUp(queued);
      segmenter.failWith = new Error('boom');

      await expect(execute()).rejects.toThrow('boom');
      expect(await stored(postgresCore)).toMatchObject({ status: 'queued', attempt: 0 });
    });
  });
});
