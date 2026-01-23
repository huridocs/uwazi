import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

import { PXCreateParagraphs } from '#api/paragraphExtraction/application/PXCreateParagraphs.js';

import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';

import { PXExtractionKey } from '#api/paragraphExtraction/domain/PXExtractionKey.js';

import { PXExtractionService } from '#api/paragraphExtraction/domain/PXExtractionService.js';

import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ObjectId } from 'mongodb';
import {
  mongoPXEntitiesStatusCollection,
  MongoPXEntitiesStatusDataSource,
} from '#api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';
import { MongoPXEntityStatusDBO } from '#api/paragraphExtraction/infrastructure/MongoPXEntityStatusDBO.js';
import { PXCreateParagraphsJob } from '#api/paragraphExtraction/infrastructure/PXCreateParagraphsJob.js';
import { PXExtractorsQueryServiceFactory } from '#api/paragraphExtraction/infrastructure/PXExtractorsQueryServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

const extractionDBO: MongoPXEntityStatusDBO = {
  _id: new ObjectId(),
  entitySharedId: 'any_entity_shared_id',
  extractorId: new ObjectId(),
  status: EntityStatus.Processing,
};

const extractionKey = PXExtractionKey.create({
  entityStatusId: extractionDBO._id.toString(),
  tenantName: 'tenant_name',
  userId: new ObjectId().toString(),
});

const getParagraphsResultOutput = {
  mainLanguage: 'en' as const,
  availableLanguages: ['en' as const],
  paragraphs: [
    {
      paragraphNumber: 1,
      translations: [
        { language: 'en' as const, needsUserReview: false, text: 'any_text', isMainLanguage: true },
      ],
    },
  ],
  extractionKey,
};

describe('ExtractionUseCase', () => {
  const extractionService: PXExtractionService = {
    async extractParagraphs() {
      return Promise.resolve();
    },
    async getParagraphsResult() {
      return getParagraphsResultOutput;
    },
  };

  const useCase = {
    execute: jest.fn(),
  } as unknown as PXCreateParagraphs;
  let job: PXCreateParagraphsJob;

  beforeEach(async () => {
    await testingEnvironment.setUp({
      [mongoPXEntitiesStatusCollection]: [extractionDBO],
    });

    const connection = getConnection();
    const transactionManager = TransactionManagerFactory.default();
    const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
      connection,
      transactionManager,
    });
    job = new PXCreateParagraphsJob({
      extractionService,
      useCase,
      pxEntitiesStatusDS: new MongoPXEntitiesStatusDataSource(
        connection,
        transactionManager,
        SettingsDataSourceFactory.default(transactionManager),
        extractorsQueryService
      ),
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should call useCase execute with extracted data', async () => {
    const heartBeatCallBack = jest.fn();
    await job.handleDispatch(
      heartBeatCallBack,
      {
        results: {
          success: true,
          data_url: 'any_url',
          error_message: undefined,
        },
        entityStatusId: extractionKey.entityStatusId,
        tenantName: extractionKey.tenantName,
        userId: extractionKey.userId,
      },
      { retryCount: 2, maxRetries: 3, namespace: 'tenant' }
    );

    expect(useCase.execute).toHaveBeenCalledWith({
      userId: extractionKey.userId,
      entityStatusId: extractionKey.entityStatusId,
      paragraphs: getParagraphsResultOutput.paragraphs,
      onParagraphCreated: heartBeatCallBack,
    });
  });

  it('should throw a non retryable error when success is false', async () => {
    const params = {
      results: { success: false, data_url: 'any_url', error_message: 'error message' },
      entityStatusId: extractionKey.entityStatusId,
      tenantName: extractionKey.tenantName,
      userId: extractionKey.userId,
    };

    await expect(
      job.handleDispatch(jest.fn(), params, { retryCount: 2, maxRetries: 3, namespace: 'tenant' })
    ).rejects.toBeInstanceOf(NonRetryableJobError);
  });

  it('should throw a non retryable error when data_url is undefined', async () => {
    const params = {
      results: { success: true, data_url: undefined, error_message: undefined },
      entityStatusId: extractionKey.entityStatusId,
      tenantName: extractionKey.tenantName,
      userId: extractionKey.userId,
    };

    await expect(
      job.handleDispatch(jest.fn(), params, { retryCount: 2, maxRetries: 3, namespace: 'tenant' })
    ).rejects.toBeInstanceOf(NonRetryableJobError);
  });

  it('should set Extraction status to "error" if use case is not going be retried', async () => {
    const params = {
      results: { success: false, data_url: 'url', error_message: undefined },
      entityStatusId: extractionKey.entityStatusId,
      tenantName: extractionKey.tenantName,
      userId: extractionKey.userId,
    };

    await expect(
      job.handleDispatch(jest.fn(), params, { retryCount: 2, maxRetries: 3, namespace: 'tenant' })
    ).rejects.toBeInstanceOf(NonRetryableJobError);

    const extractions1 = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);

    expect(extractions1).toMatchObject([
      { _id: extractionDBO._id, status: EntityStatus.Processing },
    ]);

    await expect(
      job.handleDispatch(jest.fn(), params, { retryCount: 3, maxRetries: 3, namespace: 'tenant' })
    ).rejects.toBeInstanceOf(NonRetryableJobError);

    const extractions2 = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);
    expect(extractions2).toMatchObject([{ _id: extractionDBO._id, status: EntityStatus.Error }]);
  });
});
