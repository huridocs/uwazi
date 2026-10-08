import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { IdempotencyKey } from '../../domain/IdempotencyKey.js';
import { OcrFailureReason } from '../../domain/OcrFailureReason.js';
import { OcrRecord } from '../../domain/OcrRecord.js';
import { OcrStatus } from '../../domain/OcrStatus.js';
import { OcrRecordDataSourceFactory } from '../../infrastructure/factories/OcrRecordDataSourceFactory.js';
import {
  f,
  UNKNOWN_ID,
  MALFORMED_ID,
  fixtures,
  storedOcrRecords,
  testConfigs,
  selectBackend,
} from './OcrContractFixtures.js';

const snapshot = (record: OcrRecord | undefined) =>
  record && {
    id: record.id,
    sourceFileId: record.sourceFileId,
    filename: record.filename,
    language: record.language,
    status: record.status,
    attempt: record.attempt,
    requestedAt: record.requestedAt,
    lastUpdated: record.lastUpdated,
    resultFileId: record.resultFileId,
    failureReason: record.failureReason,
  };

const ids = (records: OcrRecord[]) => records.map(record => record.id).sort();

describe('OcrRecordDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true, postgresMirror: ['ocr_records'] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      selectBackend(usePostgres);
      await testingEnvironment.setFixtures(fixtures);
    });

    const sut = () => testingEnvironment.runWithContext(() => OcrRecordDataSourceFactory.default());

    describe('getById()', () => {
      it('should load a ready record with its result file', async () => {
        expect(snapshot(await sut().getById(f.idString('ready')))).toEqual({
          id: f.idString('ready'),
          sourceFileId: f.idString('fileD'),
          filename: 'd.pdf',
          language: 'en',
          status: OcrStatus.READY,
          attempt: 1,
          requestedAt: 1000,
          lastUpdated: 2000,
          resultFileId: f.idString('resultD'),
          failureReason: undefined,
        });
      });

      it('should load a failed record with its reason', async () => {
        expect(snapshot(await sut().getById(f.idString('failed')))).toMatchObject({
          status: OcrStatus.FAILED,
          failureReason: OcrFailureReason.INVALID_PDF,
        });
      });

      it('should load a record whose source file is gone', async () => {
        expect(snapshot(await sut().getById(f.idString('detached')))).toMatchObject({
          sourceFileId: null,
          resultFileId: f.idString('resultF'),
        });
      });

      it('should load a queued record with no request time', async () => {
        expect(snapshot(await sut().getById(f.idString('queued')))).toMatchObject({
          status: OcrStatus.QUEUED,
          attempt: 0,
          requestedAt: undefined,
          resultFileId: undefined,
        });
      });

      it.each([
        ['an unknown id', UNKNOWN_ID],
        ['a malformed id', MALFORMED_ID],
      ])('should return undefined for %s', async (_case, id) => {
        expect(await sut().getById(id)).toBeUndefined();
      });
    });

    describe('getBySourceFileId()', () => {
      it('should find the record of a source file', async () => {
        expect((await sut().getBySourceFileId(f.idString('fileE')))?.id).toBe(f.idString('failed'));
      });

      it.each([
        ['an unknown id', UNKNOWN_ID],
        ['a malformed id', MALFORMED_ID],
      ])('should return undefined for %s', async (_case, id) => {
        expect(await sut().getBySourceFileId(id)).toBeUndefined();
      });
    });

    describe('getByFilename()', () => {
      it('should find the record by the filename the service knows', async () => {
        expect((await sut().getByFilename('b.pdf'))?.id).toBe(f.idString('processing'));
      });

      it('should not find a record whose source file is gone', async () => {
        expect(await sut().getByFilename('f.pdf')).toBeUndefined();
      });

      it('should return undefined for an unknown filename', async () => {
        expect(await sut().getByFilename('nope.pdf')).toBeUndefined();
      });
    });

    describe('create()', () => {
      it('should store a new queued record', async () => {
        const created = await sut().create(
          OcrRecord.request({
            id: f.idString('new'),
            sourceFileId: f.idString('fileNew'),
            filename: 'new.pdf',
            language: 'es',
          })
        );

        expect(created).toBe(true);
        expect(await storedOcrRecords(usePostgres)).toContainEqual({
          id: f.idString('new'),
          sourceFileId: f.idString('fileNew'),
          status: 'queued',
          attempt: 0,
        });
        expect(snapshot(await sut().getById(f.idString('new')))).toMatchObject({
          language: 'es',
          lastUpdated: expect.any(Number),
        });
      });

      it('should store the language as ISO 639-3', async () => {
        await sut().create(
          OcrRecord.request({
            id: f.idString('new'),
            sourceFileId: f.idString('fileNew'),
            filename: 'new.pdf',
            language: 'es',
          })
        );

        const stored = usePostgres
          ? await testingEnvironment.pg.getAllFrom('ocr_records')
          : await testingEnvironment.db.getAllFrom('ocr_records');
        expect(stored.find(r => String(r._id) === f.idString('new'))?.language).toBe('spa');
      });

      it('should not create a second record for a source file that has one', async () => {
        const before = await storedOcrRecords(usePostgres);

        const created = await sut().create(
          OcrRecord.request({
            id: f.idString('duplicate'),
            sourceFileId: f.idString('fileA'),
            filename: 'a.pdf',
            language: 'en',
          })
        );

        expect(created).toBe(false);
        expect(await storedOcrRecords(usePostgres)).toEqual(before);
      });

      it('should allow several records without a source file', async () => {
        const created = await sut().create(
          OcrRecord.request({
            id: f.idString('anotherDetached'),
            sourceFileId: null,
            filename: 'g.pdf',
            language: 'en',
          })
        );

        expect(created).toBe(true);
        expect((await storedOcrRecords(usePostgres)).map(r => r.id)).toContain(
          f.idString('anotherDetached')
        );
      });
    });

    describe('save()', () => {
      it('should persist a submission', async () => {
        const record = (await sut().getById(f.idString('queued')))!;
        record.submit();

        await sut().save(record);

        expect(snapshot(await sut().getById(f.idString('queued')))).toMatchObject({
          status: OcrStatus.PROCESSING,
          attempt: 1,
          requestedAt: record.lastUpdated,
          lastUpdated: record.lastUpdated,
        });
      });

      it('should persist a result', async () => {
        const record = (await sut().getById(f.idString('otherProcessing')))!;
        record.complete(IdempotencyKey.of(record.id, record.attempt), f.idString('resultNew'));

        await sut().save(record);

        expect(snapshot(await sut().getById(f.idString('otherProcessing')))).toMatchObject({
          status: OcrStatus.READY,
          resultFileId: f.idString('resultNew'),
          lastUpdated: record.lastUpdated,
        });
      });

      it('should persist a failure and clear it on retry', async () => {
        const record = (await sut().getById(f.idString('failed')))!;
        record.retry();

        await sut().save(record);

        expect(snapshot(await sut().getById(f.idString('failed')))).toMatchObject({
          status: OcrStatus.QUEUED,
          failureReason: undefined,
          lastUpdated: record.lastUpdated,
        });
      });

      it('should persist a source file removal', async () => {
        const record = (await sut().getById(f.idString('ready')))!;
        record.sourceRemoved();

        await sut().save(record);

        expect(snapshot(await sut().getById(f.idString('ready')))).toMatchObject({
          sourceFileId: null,
          resultFileId: f.idString('resultD'),
        });
      });

      it('should not bring back a record deleted in the meantime', async () => {
        const record = (await sut().getById(f.idString('queued')))!;
        await sut().delete([f.idString('queued')]);
        record.submit();

        await sut().save(record);

        expect((await storedOcrRecords(usePostgres)).map(r => r.id)).not.toContain(
          f.idString('queued')
        );
      });
    });

    describe('getForFiles()', () => {
      it('should return the records whose source or result is one of the files', async () => {
        const found = await sut().getForFiles([
          f.idString('fileA'),
          f.idString('resultD'),
          f.idString('resultF'),
          UNKNOWN_ID,
        ]);

        expect(ids(found)).toEqual(
          [f.idString('queued'), f.idString('ready'), f.idString('detached')].sort()
        );
      });

      it.each([
        ['no ids', []],
        ['unknown or malformed ids', [UNKNOWN_ID, MALFORMED_ID]],
      ])('should return nothing for %s', async (_case, fileIds) => {
        expect(await sut().getForFiles(fileIds)).toEqual([]);
      });
    });

    describe('delete()', () => {
      it('should delete only the given records', async () => {
        const before = await storedOcrRecords(usePostgres);

        await sut().delete([f.idString('ready'), f.idString('failed'), UNKNOWN_ID, MALFORMED_ID]);

        expect(await storedOcrRecords(usePostgres)).toEqual(
          before.filter(r => ![f.idString('ready'), f.idString('failed')].includes(r.id))
        );
      });

      it('should do nothing for no ids', async () => {
        const before = await storedOcrRecords(usePostgres);

        await sut().delete([]);

        expect(await storedOcrRecords(usePostgres)).toEqual(before);
      });
    });
  });
});
