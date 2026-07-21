// eslint-disable-next-line node/no-restricted-import
import { readFile } from 'fs/promises';

import { TestUtils } from '#api/common.v2/utils/Test.js';
import { WebSockets } from '#api/core/application/contracts/WebSockets.js';
import { PDFPostProcessJob } from '#api/core/application/PDFPostProcessJob.js';
import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { ProcessingFileNotFound } from '#api/core/domain/files/errors.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { Result } from '#api/core/libs/Result.js';
import { FileUpdatedEvent } from '#api/files/events/FileUpdatedEvent.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/index.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { createHash } from 'crypto';
import { FilesServiceFactory } from '../../factories/FilesServiceFactory.js';
import { IdGeneratorFactory } from '../../factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory.js';
import { FileIsNotAPDF, PDFService } from '../../services/PDFService.js';
import { PDFPostProcessJobHandler } from '../PDFPostProcessJobHandler.js';
import { EntitiesDataSourceFactory } from '../../factories/EntitiesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '../../factories/SettingsDataSourceFactory.js';
import { search } from '#api/search/search.js';

async function filesAreIdentical(file1: string, file2: string) {
  const [buf1, buf2] = await Promise.all([readFile(file1), readFile(file2)]);
  const hash1 = createHash('sha256').update(new Uint8Array(buf1)).digest('hex');
  const hash2 = createHash('sha256').update(new Uint8Array(buf2)).digest('hex');
  return hash1 === hash2;
}

const setUpJob = (pdfService = new PDFService()) => {
  const transactionManager = TransactionManagerFactory.default();

  const wSockets = TestUtils.mockClass<WebSockets>({
    emitToTenant: jest.fn(),
  });

  const eventBus = TestUtils.mockClass<EventsBus>({
    emit: jest.fn(),
  });

  return testingEnvironment.runWithContext(() => ({
    job: new PDFPostProcessJobHandler({
      useCase: new PDFPostProcessJob({
        eventBus,
        transactionManager,
        filesDS: FilesDataSourceFactory.default(),
        fileStorage: FileStorageFactory.default(),
        pdfService,
        idGenerator: IdGeneratorFactory.default(),
        filesService: FilesServiceFactory.default({ eventBus }),
        entitiesDS: EntitiesDataSourceFactory.default({ transactionManager }),
        settingsDS: SettingsDataSourceFactory.default({ transactionManager }),
      }),
      wSockets,
    }),
    wSockets,
    eventBus,
  }));
};

const f = getFixturesFactory();
const heartBeatCallBack = jest.fn();

describe('PDFPostProcessJob', () => {
  beforeEach(async () => {
    const fixtures = {
      settings: [{ languages: [{ label: 'English', default: true, key: 'en' as const }] }],
      templates: [f.template('template')],
      entities: [...f.entityInMultipleLanguages(['en'], 'fileEntity', 'template')],
      files: [
        f.document('processing_doc', {
          status: 'processing',
          filename: 'english.pdf',
          entity: 'fileEntity',
          mimetype: 'application/pdf',
          size: 1000,
          creationDate: 1000,
        }),
      ],
    };

    jest.spyOn(search, 'indexEntities').mockImplementation(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
    await testingEnvironment.setupTenantTmpPaths(fixtures.files);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const executeJob = async (
    job: PDFPostProcessJobHandler,
    documentId: string,
    jobInfo: { maxRetries: number; retryCount: number } = {
      maxRetries: 5,
      retryCount: 1,
    }
  ) =>
    job.handleDispatch(
      heartBeatCallBack,
      {
        documentId,
        tenantName: tenants.current().name,
        userId: permissionsContext.getUserInContext()?._id?.toString() || '',
      },
      { namespace: tenants.current().name, ...jobInfo }
    );

  it('should set the document status to "ready"', async () => {
    const { job } = setUpJob();
    await executeJob(job, f.idString('processing_doc'));

    const [processed] = await testingEnvironment.db.getAllFrom('files');
    expect(processed.status).toBe('ready');
  });

  it('should create a thumbnail of the document', async () => {
    const { job } = setUpJob();
    await executeJob(job, f.idString('processing_doc'));

    const [thumbnail] = (await testingEnvironment.db.getAllFrom('files')).filter(
      file => file.type === 'thumbnail'
    );
    expect(thumbnail.filename).toBe(`${f.idString('processing_doc')}.jpg`);

    const thumbnailPath = `${tenants.current().uploadedDocuments}/${thumbnail.filename}`;

    expect(
      await filesAreIdentical(
        testingEnvironment.testingFilesPath('english.pdf.thumb.proof.jpg'),
        thumbnailPath
      )
    ).toBe(true);
  });

  it('should emit FileUpdatedEvent', async () => {
    const { job, eventBus } = setUpJob();
    await executeJob(job, f.idString('processing_doc'));

    expect(eventBus.emit).toHaveBeenCalledWith(
      new FileUpdatedEvent({
        before: expect.objectContaining({ filename: 'english.pdf', status: 'processing' }),
        after: expect.objectContaining({ filename: 'english.pdf', status: 'ready' }),
      })
    );
  });

  describe('on Error (when not all retries exhausted)', () => {
    it('should maintain the status on "processing"', async () => {
      const { job } = setUpJob(
        TestUtils.mockClass<PDFService>({
          extractText: jest
            .fn()
            .mockImplementation(() => Result.fail(new Error('Extract text error'))),
        })
      );

      await expect(async () => executeJob(job, f.idString('processing_doc'))).rejects.toThrow();

      const files = await testingEnvironment.db.getAllFrom('files');
      expect(files).toMatchObject([
        {
          filename: 'english.pdf',
          status: 'processing',
        },
      ]);
    });
  });

  describe('on Error (when all retries are exhausted)', () => {
    it('should set "failed" status', async () => {
      const { job } = setUpJob(
        TestUtils.mockClass<PDFService>({
          extractText: jest
            .fn()
            .mockImplementation(() => Result.fail(new Error('Extract text error'))),
        })
      );

      await expect(async () =>
        executeJob(job, f.idString('processing_doc'), {
          maxRetries: 5,
          retryCount: 5,
        })
      ).rejects.toThrow();

      const files = await testingEnvironment.db.getAllFrom('files');
      expect(files).toMatchObject([{ filename: 'english.pdf', status: 'failed' }]);
    });

    it('should emit a "conversionFailed" event to tenant', async () => {
      const { job, wSockets } = setUpJob(
        TestUtils.mockClass<PDFService>({
          extractText: jest
            .fn()
            .mockImplementation(() => Result.fail(new Error('Extract text error'))),
        })
      );

      await expect(async () =>
        executeJob(job, f.idString('processing_doc'), {
          maxRetries: 5,
          retryCount: 5,
        })
      ).rejects.toThrow();

      expect(wSockets.emitToTenant).toHaveBeenCalledWith(
        tenants.current().name,
        'conversionFailed',
        'fileEntity',
        expect.objectContaining({
          _id: f.idString('processing_doc'),
          status: 'failed',
        })
      );
    });
  });

  describe('on FileIsNotAPDF error', () => {
    it('should throw a NonRetrieable Error', async () => {
      const { job } = setUpJob(
        TestUtils.mockClass<PDFService>({
          extractText: jest
            .fn()
            .mockImplementation(() => Result.fail(new FileIsNotAPDF(new DiskFile('full/path')))),
        })
      );

      await expect(async () => executeJob(job, f.idString('processing_doc'))).rejects.toThrow(
        NonRetryableJobError
      );
    });

    it('should emit a "conversionFailed" event to tenant', async () => {
      const { job, wSockets } = setUpJob(
        TestUtils.mockClass<PDFService>({
          extractText: jest
            .fn()
            .mockImplementation(() => Result.fail(new FileIsNotAPDF(new DiskFile('full/path')))),
        })
      );

      await expect(async () => executeJob(job, f.idString('processing_doc'))).rejects.toThrow();

      expect(wSockets.emitToTenant).toHaveBeenCalledWith(
        tenants.current().name,
        'conversionFailed',
        'fileEntity',
        expect.objectContaining({
          _id: f.idString('processing_doc'),
          status: 'failed',
        })
      );
    });
  });

  describe('on File does not exist error', () => {
    it('should throw a NonRetrieable Error', async () => {
      const { job } = setUpJob(
        TestUtils.mockClass<PDFService>({
          extractText: jest
            .fn()
            .mockImplementation(() => Result.fail(new Error('Extract text error'))),
        })
      );

      await expect(async () =>
        executeJob(job, f.idString('document_does_not_exist'))
      ).rejects.toThrow(
        new NonRetryableJobError(new ProcessingFileNotFound(f.idString('document_does_not_exist')))
      );
    });
  });
});
