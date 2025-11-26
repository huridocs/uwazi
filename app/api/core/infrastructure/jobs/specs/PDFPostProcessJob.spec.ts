// eslint-disable-next-line node/no-restricted-import
import { copyFile } from 'fs/promises';

import { TestUtils } from 'api/common.v2/utils/Test';
import { WebSockets } from 'api/core/application/contracts/WebSockets';
import { FilesService } from 'api/core/application/FilesService';
import { PDFPostProcess } from 'api/core/application/PDFPostProcess';
import { DiskFile } from 'api/core/domain/files/DiskFile';
import { ProcessingFileNotFound } from 'api/core/domain/files/errors';
import { FilesDataSourceFactory } from 'api/core/infrastructure/factories/FilesDataSourceFactory';
import { FileStorageFactory } from 'api/core/infrastructure/files/FileStorageFactory';
import { EventsBus } from 'api/core/libs/eventsbus';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { Result } from 'api/core/libs/Result';
import { tenants } from 'api/tenants';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import path from 'path';
import { IdGeneratorFactory } from '../../factories/IdGeneratorFactory';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { FileContentsIO } from '../../files/FileContentIO';
import { FileIsNotAPDF, PDFService } from '../../services/PDFService';
import { PDFPostProcessJob } from '../PDFPostProcessJob';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { permissionsContext } from 'api/permissions/permissionsContext';

const setUpJob = (pdfService = new PDFService()) => {
  const transactionManager = TransactionManagerFactory.default();

  const wSockets = TestUtils.mockClass<WebSockets>({
    emitToTenant: jest.fn(),
  });

  const eventBus = TestUtils.mockClass<EventsBus>({
    emit: jest.fn(),
  });

  return {
    job: new PDFPostProcessJob({
      useCase: new PDFPostProcess({
        eventBus,
        transactionManager,
        filesDS: FilesDataSourceFactory.default(transactionManager),
        fileStorage: FileStorageFactory.default(),
        pdfService,
        idGenerator: IdGeneratorFactory.default(),
        filesIO: new FileContentsIO(),
        filesService: new FilesService({
          idGenerator: IdGeneratorFactory.default(),
          fileStorage: FileStorageFactory.default(),
          filesDS: FilesDataSourceFactory.default(transactionManager),
          jobsDispatcher: DefaultDispatcher(tenants.current().name),
          pdfService: new PDFService(),
          filesIO: new FileContentsIO(),
        }),
      }),
      wSockets,
    }),
    wSockets,
    eventBus,
  };
};

const f = getFixturesFactory();
const heartBeatCallBack = jest.fn();

describe('PDFPostProcessJob', () => {
  beforeEach(async () => {
    const fixtures = {
      files: [
        f.document('processing_doc', {
          status: 'processing',
          filename: 'eng.pdf',
          entity: 'fileEntity',
        }),
      ],
    };
    await testingEnvironment.setUp(fixtures);
    await testingEnvironment.setupTenantTmpPaths(fixtures.files);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const executeJob = async (
    job: PDFPostProcessJob,
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
    const { job, wSockets } = setUpJob();
    await executeJob(job, f.idString('processing_doc'));

    expect(wSockets.emitToTenant).toHaveBeenCalledWith(
      tenants.current().name,
      'documentProcessed',
      'fileEntity',
      expect.objectContaining({ filename: 'eng.pdf', status: 'ready' })
    );
  });

  it('should emit FileUpdatedEvent', async () => {
    const { job, eventBus } = setUpJob();
    await executeJob(job, f.idString('processing_doc'));

    expect(eventBus.emit).toHaveBeenCalledWith(
      new FileUpdatedEvent({
        before: expect.objectContaining({ filename: 'eng.pdf', status: 'processing' }),
        after: expect.objectContaining({ filename: 'eng.pdf', status: 'ready' }),
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
          filename: 'eng.pdf',
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
      expect(files).toMatchObject([{ filename: 'eng.pdf', status: 'failed' }]);
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
