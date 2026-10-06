import { access, readdir } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { RelationshipsV1DataSource } from '#shared/contracts/RelationshipsV1DataSource.js';
import { RelationshipsV1DataSourceFactory } from '#api/core/infrastructure/factories/RelationshipsV1DataSourceFactory.js';
import { SaveOcrResultFactory } from '../../infrastructure/factories/SaveOcrResultFactory.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { OcrFailureReason } from '../../domain/OcrFailureReason.js';
import { OcrOutcome } from '../contracts/OcrEngine.js';
import { MalformedOcrResult } from '../errors/MalformedOcrResult.js';
import { OcrResultGone } from '../errors/OcrResultGone.js';
import { FakeOcrEngine } from './FakeOcrEngine.js';
import { submitJobs } from './OcrIntakeFixtures.js';
import {
  f,
  SOURCE,
  FILENAME,
  withProcessing,
  selectBackend,
  setUpBackends,
  storedFiles,
  storedReferences,
  storedRecord,
  testConfigs,
} from './OcrResultFixtures.js';

const handle = { fileUrl: 'http://service/result' };
const key = (attempt: number) => IdempotencyKey.of(f.idString('record'), attempt);
const success = (overrides: Partial<OcrOutcome> = {}) =>
  ({ filename: FILENAME, key: key(2), succeeded: true, handle, ...overrides }) as OcrOutcome;

describe('SaveOcrResult', () => {
  let engine: FakeOcrEngine;

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
    const setUp = async (record: Record<string, unknown> = {}, source: object | null = null) => {
      // Resets the tenant's feature flags, so it has to come before selectBackend.
      await testingEnvironment.setupTenantTmpPaths([{ filename: FILENAME, type: 'document' }]);
      selectBackend(postgresCore);
      await testingEnvironment.setFixtures(withProcessing(record, source));
      await testingEnvironment.jobs.clear();
      engine = new FakeOcrEngine();
      engine.result = { pdf: Readable.from(['%PDF-1.4 ocr']), mimetype: 'application/pdf' };
    };

    const execute = async (
      outcome: OcrOutcome,
      overrides: { relationshipsV1DS?: RelationshipsV1DataSource } = {}
    ) =>
      testingEnvironment.runWithContext(async () =>
        SaveOcrResultFactory.default({
          ocrEngine: engine,
          ...overrides,
        }).execute(outcome)
      );

    const newFile = async () => (await storedFiles()).find(file => file.id !== f.idString(SOURCE));

    const blobExists = async (filename: string) =>
      access(path.join(testingTenants.current().uploadedDocuments, filename)).then(
        () => true,
        () => false
      );

    const expectUntouched = async () => {
      expect(await storedFiles()).toEqual([
        expect.objectContaining({ id: f.idString(SOURCE), type: 'document' }),
      ]);
      expect(await storedRecord(postgresCore)).toMatchObject({ status: 'processing', attempt: 2 });
    };

    it('should store the result as the new document and demote the original to an attachment', async () => {
      await setUp();

      await execute(success());

      const created = (await newFile())!;
      expect(created).toMatchObject({
        type: 'document',
        originalname: `ocr_${FILENAME}`,
        status: 'processing',
      });
      expect(await storedFiles()).toContainEqual(
        expect.objectContaining({ id: f.idString(SOURCE), type: 'attachment' })
      );
      expect(await blobExists(created.filename)).toBe(true);
    });

    it('should move the text references of the original to the result', async () => {
      await setUp();

      await execute(success());

      const references = Object.fromEntries(
        (await storedReferences()).map(({ id, file }) => [id, file])
      );
      expect(references).toEqual({
        [f.idString('otherRef')]: f.idString('other'),
        [f.idString('textRef')]: (await newFile())!.id,
      });
    });

    it('should mark the record ready with its result and report it settled', async () => {
      await setUp();

      const settled = await execute(success());

      expect(await storedRecord(postgresCore)).toMatchObject({
        status: 'ready',
        resultFileId: (await newFile())!.id,
      });
      expect(settled).toEqual({ status: 'ready', sourceFileId: f.idString(SOURCE) });
    });

    it('should take a result with no key as the current attempt, finding the record by filename', async () => {
      await setUp();

      await execute(success({ key: undefined }));

      expect(await storedRecord(postgresCore)).toMatchObject({ status: 'ready' });
    });

    it.each([
      ['a stale key', { status: 'processing' }, success({ key: key(1) })],
      ['a duplicate', { status: 'ready', resultFile: f.id('done') }, success()],
    ])('should ignore %s, fetching nothing', async (_case, record, outcome) => {
      await setUp(record);
      const fetch = jest.spyOn(engine, 'fetchResult');

      const settled = await execute(outcome);

      expect(fetch).not.toHaveBeenCalled();
      expect(await storedFiles()).toEqual([
        expect.objectContaining({ id: f.idString(SOURCE), type: 'document' }),
      ]);
      expect(settled).toBeUndefined();
    });

    it('should do nothing for a record that does not exist', async () => {
      await setUp();

      const settled = await execute(success({ filename: 'other.pdf', key: undefined }));

      await expectUntouched();
      expect(settled).toBeUndefined();
    });

    it('should fail the record and report it settled when the service reported a failure', async () => {
      await setUp();

      const settled = await execute({
        filename: FILENAME,
        key: key(2),
        succeeded: false,
        reason: OcrFailureReason.INVALID_PDF,
      });

      expect(await storedRecord(postgresCore)).toMatchObject({
        status: 'failed',
        failureReason: 'invalidPdf',
      });
      expect(settled).toEqual({ status: 'failed', sourceFileId: f.idString(SOURCE) });
    });

    it.each([
      ['no longer exists', { sourceFile: f.id('vanished') }],
      ['is no longer a document', null],
    ])('should fail the record when its source file %s', async (_case, override) => {
      const attachment = {
        ...f.attachment(SOURCE, {
          entity: 'entity',
          filename: FILENAME,
          mimetype: 'application/pdf',
        }),
      };
      await setUp(override ?? {}, override ? null : attachment);

      const settled = await execute(success());

      expect(await storedRecord(postgresCore)).toMatchObject({
        status: 'failed',
        failureReason: 'sourceGone',
      });
      expect(await storedFiles()).toHaveLength(1);
      expect(settled).toEqual({ status: 'failed', sourceFileId: expect.any(String) });
    });

    it('should queue the record again when the service no longer has the result', async () => {
      await setUp();
      jest.spyOn(engine, 'fetchResult').mockRejectedValue(new OcrResultGone());

      const settled = await execute(success());

      expect(settled).toBeUndefined();
      expect(await storedRecord(postgresCore)).toMatchObject({ status: 'queued', attempt: 2 });
      expect(await submitJobs(postgresCore)).toEqual([
        {
          params: expect.objectContaining({ recordId: f.idString('record') }),
          lockedUntil: expect.any(Number),
        },
      ]);
      expect(await storedFiles()).toHaveLength(1);
    });

    it('should fail the record when the result cannot be understood', async () => {
      await setUp();
      jest.spyOn(engine, 'fetchResult').mockRejectedValue(new MalformedOcrResult('nope'));

      await execute(success());

      expect(await storedRecord(postgresCore)).toMatchObject({
        status: 'failed',
        failureReason: 'unexpected',
      });
    });

    it('should leave nothing behind, and retry, when storing the result fails', async () => {
      await setUp();
      const relationshipsV1DS = await testingEnvironment.runWithContext(async () =>
        RelationshipsV1DataSourceFactory.default()
      );
      jest.spyOn(relationshipsV1DS, 'updateMany').mockRejectedValue(new Error('boom'));

      await expect(execute(success(), { relationshipsV1DS })).rejects.toThrow('boom');

      await expectUntouched();
      expect(
        (await readdir(testingTenants.current().uploadedDocuments)).filter(name =>
          name.endsWith('.pdf')
        )
      ).toEqual([]);
      expect(await storedReferences()).toContainEqual({
        id: f.idString('textRef'),
        file: f.idString(SOURCE),
      });
    });
  });
});
