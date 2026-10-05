import { FileNotFound } from '#api/core/domain/files/errors.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { GetOcrStatusFactory } from '../../infrastructure/factories/GetOcrStatusFactory.js';
import { FileIsNotADocument } from '../errors/FileIsNotADocument.js';
import { OcrNotEnabled } from '../errors/OcrNotEnabled.js';
import { FakeFileStorage, ALL_PDFS } from './FakeFileStorage.js';
import { FakeOcrEngine } from './FakeOcrEngine.js';
import {
  f,
  record,
  withRecords,
  selectBackend,
  setUpBackends,
  testConfigs,
} from './OcrIntakeFixtures.js';

describe('GetOcrStatus', () => {
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
      engine = new FakeOcrEngine();
      existing = ALL_PDFS;
    };

    const execute = async (filename = 'scan.pdf') =>
      testingEnvironment.runWithContext(async () =>
        GetOcrStatusFactory.default({
          ocrEngine: engine,
          fileStorage: new FakeFileStorage(existing),
        }).execute({ filename })
      );

    const ofScan = (overrides: object) =>
      record('scan', { sourceFile: f.id('scan'), lastUpdated: 4000, ...overrides });

    it('should report a file with no record as having none', async () => {
      await setUp();

      expect(await execute()).toEqual({ status: 'none' });
    });

    it.each([
      ['queued', { status: 'queued' }],
      ['processing', { status: 'processing', attempt: 1, requestedAt: 3000 }],
      ['failed', { status: 'failed', attempt: 1, failureReason: 'timeout' }],
      ['ready', { status: 'ready', attempt: 1, resultFile: f.id('result') }],
    ])('should report a %s record with when it last changed', async (status, overrides) => {
      await setUp([ofScan(overrides)]);

      expect(await execute()).toEqual({ status, lastUpdated: 4000 });
    });

    it('should report a result file as ready, through the record it belongs to', async () => {
      await setUp([
        record('other', {
          sourceFile: f.id('somewhere'),
          resultFile: f.id('scan'),
          status: 'ready',
          attempt: 1,
        }),
      ]);

      expect(await execute()).toEqual({ status: 'ready', lastUpdated: 1000 });
    });

    it('should report an unsupported language, unless the record is ready', async () => {
      await setUp([ofScan({ status: 'failed', attempt: 1 })]);
      engine.supportedLanguages = [];

      expect(await execute()).toEqual({ status: 'unsupportedLanguage' });
    });

    it('should not ask the service about the language of a ready file', async () => {
      await setUp([ofScan({ status: 'ready', attempt: 1, resultFile: f.id('result') })]);
      engine.supportedLanguages = [];

      expect((await execute()).status).toBe('ready');
      expect(engine.asked).toEqual([]);
    });

    it('should report a file with no record in a language the service does not read', async () => {
      await setUp();

      expect(await execute('french.pdf')).toEqual({ status: 'unsupportedLanguage' });
    });

    it('should refuse a file that is not a document and has no record', async () => {
      await setUp();

      await expect(execute('attachment.pdf')).rejects.toBeInstanceOf(FileIsNotADocument);
    });

    it('should refuse a file that does not exist, or whose content is missing', async () => {
      await setUp();
      await expect(execute('nope.pdf')).rejects.toBeInstanceOf(FileNotFound);

      existing = [];
      await expect(execute()).rejects.toBeInstanceOf(FileNotFound);
    });

    it('should refuse when OCR is not enabled', async () => {
      await setUp([], { ocrOn: false });

      await expect(execute()).rejects.toBeInstanceOf(OcrNotEnabled);
    });
  });
});
