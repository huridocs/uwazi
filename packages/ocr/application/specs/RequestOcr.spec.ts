import { FileNotFound } from '#api/core/domain/files/errors.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RequestOcrFactory } from '../../infrastructure/factories/RequestOcrFactory.js';
import { FileIsNotADocument } from '../errors/FileIsNotADocument.js';
import { OcrAlreadyActive } from '../errors/OcrAlreadyActive.js';
import { OcrLanguageNotSupported } from '../errors/OcrLanguageNotSupported.js';
import { OcrNotEnabled } from '../errors/OcrNotEnabled.js';
import { FakeFileStorage, ALL_PDFS } from './FakeFileStorage.js';
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

describe('RequestOcr', () => {
  let engine: FakeOcrEngine;

  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    let existing = ALL_PDFS;

    const setUp = async (records: object[] = [], features?: Parameters<typeof withRecords>[1]) => {
      selectBackend(postgresCore);
      await testingEnvironment.setFixtures(withRecords(records, features));
      await testingEnvironment.jobs.clear();
      engine = new FakeOcrEngine();
      existing = ALL_PDFS;
    };

    const execute = async (filename = 'scan.pdf') =>
      testingEnvironment.runWithContext(async () =>
        RequestOcrFactory.default({
          ocrEngine: engine,
          fileStorage: new FakeFileStorage(existing),
        }).execute({ filename })
      );

    it('should store a queued record for the file and dispatch its submission', async () => {
      await setUp();

      await execute();

      const [stored] = await storedRecords(postgresCore);
      expect(stored).toMatchObject({
        sourceFileId: f.idString('scan'),
        language: 'eng',
        status: 'queued',
        attempt: 0,
      });
      expect(await submitJobs(postgresCore)).toEqual([
        {
          params: expect.objectContaining({ recordId: stored.id }),
          lockedUntil: expect.any(Number),
        },
      ]);
      expect(engine.submitted).toEqual([]);
    });

    it('should ask the service about the language of the file', async () => {
      await setUp();

      await execute();

      expect(engine.asked).toEqual(['en']);
    });

    it.each([
      ['switched off', { ocrOn: false }],
      ['disabled for the service', { serviceEnabled: false }],
    ])('should refuse when OCR is %s, storing nothing', async (_case, features) => {
      await setUp([], features);

      await expect(execute()).rejects.toBeInstanceOf(OcrNotEnabled);
      expect(await storedRecords(postgresCore)).toEqual([]);
      expect(await submitJobs(postgresCore)).toEqual([]);
    });

    it('should refuse a file that does not exist', async () => {
      await setUp();

      await expect(execute('nope.pdf')).rejects.toBeInstanceOf(FileNotFound);
    });

    it('should refuse a file whose content is missing from storage', async () => {
      await setUp();
      existing = [];

      await expect(execute()).rejects.toBeInstanceOf(FileNotFound);
      expect(await storedRecords(postgresCore)).toEqual([]);
    });

    it('should refuse a file that is not a document', async () => {
      await setUp();

      await expect(execute('attachment.pdf')).rejects.toBeInstanceOf(FileIsNotADocument);
      expect(await storedRecords(postgresCore)).toEqual([]);
    });

    it('should refuse a language the service does not support, storing nothing', async () => {
      await setUp();

      await expect(execute('french.pdf')).rejects.toBeInstanceOf(OcrLanguageNotSupported);
      expect(await storedRecords(postgresCore)).toEqual([]);
      expect(await submitJobs(postgresCore)).toEqual([]);
    });

    it('should treat a file with no language as `other`', async () => {
      await setUp();

      await expect(execute('noLanguage.pdf')).rejects.toBeInstanceOf(OcrLanguageNotSupported);
      expect(engine.asked).toEqual(['other']);
    });

    it.each(['queued', 'processing', 'ready'])(
      'should refuse a file whose record is %s, changing nothing',
      async status => {
        await setUp([record('scan', { sourceFile: f.id('scan'), status, attempt: 1 })]);
        const before = await storedRecords(postgresCore);

        await expect(execute()).rejects.toBeInstanceOf(OcrAlreadyActive);
        expect(await storedRecords(postgresCore)).toEqual(before);
        expect(await submitJobs(postgresCore)).toEqual([]);
      }
    );

    it('should queue a failed record again, keeping its attempt, and dispatch its submission', async () => {
      await setUp([
        record('scan', {
          sourceFile: f.id('scan'),
          status: 'failed',
          attempt: 2,
          failureReason: 'unexpected',
        }),
      ]);

      await execute();

      expect(await storedRecords(postgresCore)).toEqual([
        expect.objectContaining({
          id: f.idString('scan'),
          status: 'queued',
          attempt: 2,
          failureReason: undefined,
        }),
      ]);
      expect(await submitJobs(postgresCore)).toEqual([
        {
          params: expect.objectContaining({ recordId: f.idString('scan') }),
          lockedUntil: expect.any(Number),
        },
      ]);
    });
  });
});
