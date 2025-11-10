// eslint-disable-next-line node/no-restricted-import
import { copyFile } from 'fs/promises';

import { TestUtils } from 'api/common.v2/utils/Test';
import { WebSockets } from 'api/core/application/contracts/WebSockets';
import { PDFPostProcess } from 'api/core/application/PDFPostProcess';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { Result } from 'api/core/libs/Result';
import { DefaultFilesDataSource } from 'api/files.v2/database/data_source_defaults';
import { FileStorageStrategyFactory } from 'api/files.v2/infrastructure/FileStorageStrategyFactory';
import { ProcessingFileNotFound } from 'api/files.v2/model/errors';
import { tenants } from 'api/tenants';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import path from 'path';
import { IdGeneratorFactory } from '../../factories/IdGeneratorFactory';
import { TransactionManagerFactory } from '../../factories/TransactionManagerFactory';
import { PDFService } from '../../services/PDFService';
import { PDFPostProcessJob } from '../PDFPostProcessJob';

const setUpJob = (pdfService = new PDFService()) => {
  const transactionManager = TransactionManagerFactory.default();

  const wSockets = TestUtils.mockClass<WebSockets>({
    emitToTenant: jest.fn(),
  });

  return {
    job: new PDFPostProcessJob({
      useCase: new PDFPostProcess({
        transactionManager,
        filesDS: DefaultFilesDataSource(transactionManager),
        fileStorage: FileStorageStrategyFactory.createDefault(),
        pdfService,
        idGenerator: IdGeneratorFactory.default(),
      }),
      wSockets,
    }),
    wSockets,
  };
};

const f = getFixturesFactory();
const heartBeatCallBack = jest.fn();

describe('PDFPostProcessJob', () => {
  beforeEach(async () => {
    await copyFile(
      path.join(__dirname, '../../../../files/specs', 'testing_files/eng.pdf'),
      path.join(__dirname, '../../../../files/specs', 'uploads/pdfPostProcessJob/eng.pdf')
    );
    await testingEnvironment.setUp({
      files: [
        f.document('processing_doc', {
          status: 'processing',
          filename: 'eng.pdf',
          entity: 'fileEntity',
        }),
      ],
    });
    await testingEnvironment.setTenant(undefined, 'pdfPostProcessJob');
  });

  afterAll(async () => {
    await testingEnvironment.cleanupUploadPaths();
    await testingEnvironment.tearDown();
  });

  const executeJob = async (
    job: PDFPostProcessJob,
    documentId: string,
    jobInfo: { maxRetries: number; retryCount: number } = { maxRetries: 5, retryCount: 1 }
  ) =>
    job.handleDispatch(
      heartBeatCallBack,
      { documentId, tenantName: tenants.current().name, userId: f.idString('user') },
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

  describe('on Error (when not all retries exausted)', () => {
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
      expect(files).toMatchObject([{ filename: 'eng.pdf', status: 'processing' }]);
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
        executeJob(job, f.idString('processing_doc'), { maxRetries: 5, retryCount: 5 })
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
        executeJob(job, f.idString('processing_doc'), { maxRetries: 5, retryCount: 5 })
      ).rejects.toThrow();

      expect(wSockets.emitToTenant).toHaveBeenCalledWith(
        tenants.current().name,
        'conversionFailed',
        'fileEntity',
        expect.objectContaining({ _id: f.idString('processing_doc'), status: 'failed' })
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
