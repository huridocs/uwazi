import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { SubmitOcrFactory } from '../../infrastructure/factories/SubmitOcrFactory.js';
import { OcrServiceNotConfigured } from '../errors/OcrServiceNotConfigured.js';
import { OcrServiceUnavailable } from '../errors/OcrServiceUnavailable.js';
import { FakeOcrEngine } from './FakeOcrEngine.js';
import {
  f,
  record,
  withRecords,
  selectBackend,
  setUpBackends,
  storedRecords,
  submitJobs,
  testConfigs,
} from './OcrIntakeFixtures.js';

const NOW = 1_700_000_000_000;

const queued = record('doc', { filename: 'english.pdf' });

describe('SubmitOcr', () => {
  let engine: FakeOcrEngine;
  const sockets = {
    emitToTenant: jest.fn(),
    emitToTenantAdmins: jest.fn(),
    emitToTenantAdminsAndEditors: jest.fn(),
    emitToSession: jest.fn(),
  };

  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    const setUp = async (stored: object) => {
      // Resets the tenant's feature flags, so it has to come before selectBackend.
      await testingEnvironment.setupTenantTmpPaths([{ filename: 'english.pdf', type: 'document' }]);
      selectBackend(postgresCore);
      await testingEnvironment.setFixtures(withRecords([stored]));
      await testingEnvironment.jobs.clear();
      engine = new FakeOcrEngine();
    };

    const execute = async (recordId = f.idString('doc')) =>
      testingEnvironment.runWithContext(async () =>
        SubmitOcrFactory.default({ ocrEngine: engine, sockets, now: () => NOW }).execute({
          recordId,
        })
      );

    it('should send the PDF with the key of a new attempt, then mark it processing', async () => {
      await setUp({ ...queued, language: 'spa' });

      await execute();

      expect(engine.submitted).toHaveLength(1);
      const [request] = engine.submitted;
      expect(request.key.toString()).toBe(`${f.idString('doc')}:1`);
      expect(request).toMatchObject({ filename: 'english.pdf', language: 'es' });
      expect(request.content.subarray(0, 5).toString()).toBe('%PDF-');
      expect(await storedRecords(postgresCore)).toEqual([
        expect.objectContaining({ status: 'processing', attempt: 1, requestedAt: NOW }),
      ]);
    });

    it.each(['processing', 'ready', 'failed'])('should leave a %s record alone', async status => {
      await setUp({ ...queued, status, attempt: 1 });

      await execute();

      expect(engine.submitted).toEqual([]);
      expect((await storedRecords(postgresCore))[0].status).toBe(status);
    });

    it('should do nothing for a record that no longer exists', async () => {
      await setUp(queued);

      await execute(f.idString('gone'));

      expect(engine.submitted).toEqual([]);
    });

    it('should fail a record whose source file is gone, without telling anyone', async () => {
      await setUp({ ...queued, sourceFile: null, resultFile: f.id('result') });

      await execute();

      expect(engine.submitted).toEqual([]);
      expect(await storedRecords(postgresCore)).toEqual([
        expect.objectContaining({ status: 'failed', failureReason: 'sourceGone' }),
      ]);
      expect(sockets.emitToTenantAdminsAndEditors).not.toHaveBeenCalled();
    });

    describe.each([
      [
        'the service backlog is full',
        (e: FakeOcrEngine) => {
          e.backlog = 10_000;
        },
      ],
      [
        'the service is unavailable',
        (e: FakeOcrEngine) => {
          e.failWith = new OcrServiceUnavailable();
        },
      ],
    ])('when %s', (_case, arrange) => {
      it('should keep it queued and submit it again later, without spending a retry', async () => {
        await setUp(queued);
        arrange(engine);

        await execute();

        expect(engine.submitted).toEqual([]);
        expect(await storedRecords(postgresCore)).toEqual([
          expect.objectContaining({ status: 'queued', attempt: 0 }),
        ]);
        const jobs = await submitJobs(postgresCore);
        expect(jobs).toEqual([
          {
            params: expect.objectContaining({ recordId: f.idString('doc') }),
            lockedUntil: expect.any(Number),
          },
        ]);
        expect(jobs[0].lockedUntil).toBeGreaterThan(Date.now());
      });
    });

    it.each([['has no url', new OcrServiceNotConfigured(), 'serviceNotConfigured']])(
      'should fail the record and tell the editors when the service %s',
      async (_case, error, reason) => {
        await setUp(queued);
        engine.failWith = error;

        await execute();

        expect(await storedRecords(postgresCore)).toEqual([
          expect.objectContaining({ status: 'failed', attempt: 0, failureReason: reason }),
        ]);
        expect(sockets.emitToTenantAdminsAndEditors).toHaveBeenCalledWith(
          testingTenants.current().name,
          'ocr:error',
          f.idString('file-doc')
        );
        expect(await submitJobs(postgresCore)).toEqual([]);
      }
    );

    it('should let any other failure through, keeping it queued', async () => {
      await setUp(queued);
      engine.failWith = new Error('boom');

      await expect(execute()).rejects.toThrow('boom');
      expect(await storedRecords(postgresCore)).toEqual([
        expect.objectContaining({ status: 'queued', attempt: 0 }),
      ]);
    });
  });
});
