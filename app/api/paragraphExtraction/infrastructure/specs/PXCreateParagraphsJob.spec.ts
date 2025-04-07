import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { PXCreateParagraphs } from 'api/paragraphExtraction/application/PXCreateParagraphs';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { PXExtractionKey } from 'api/paragraphExtraction/domain/PXExtractionKey';
import { PXExtractionService } from 'api/paragraphExtraction/domain/PXExtractionService';
import { NonRetryableJobError } from 'api/queue.v2/infrastructure/errors';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import {
  mongoPXEntitiesStatusCollection,
  MongoPXEntitiesStatusDataSource,
} from '../MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatusDBO } from '../MongoPXEntityStatusDBO';
import { PXCreateParagraphsJob } from '../PXCreateParagraphsJob';

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
    job = new PXCreateParagraphsJob({
      extractionService,
      useCase,
      pxEntitiesStatusDS: new MongoPXEntitiesStatusDataSource(
        getConnection(),
        DefaultTransactionManager(),
        DefaultSettingsDataSource(DefaultTransactionManager())
      ),
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should call useCase execute with extracted data', async () => {
    const heartBeatCallBack = jest.fn();
    await job.handleDispatch(heartBeatCallBack, {
      results: {
        success: true,
        data_url: 'any_url',
        error_message: undefined,
      },
      entityStatusId: extractionKey.entityStatusId,
      tenantName: extractionKey.tenantName,
      userId: extractionKey.userId,
    });

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

    await expect(job.handleDispatch(jest.fn(), params)).rejects.toBeInstanceOf(
      NonRetryableJobError
    );
  });

  it('should throw a non retryable error when data_url is undefined', async () => {
    const params = {
      results: { success: true, data_url: undefined, error_message: undefined },
      entityStatusId: extractionKey.entityStatusId,
      tenantName: extractionKey.tenantName,
      userId: extractionKey.userId,
    };

    await expect(job.handleDispatch(jest.fn(), params)).rejects.toBeInstanceOf(
      NonRetryableJobError
    );
  });

  it('should set Extraction status to "error" when the operation failed', async () => {
    const params = {
      results: { success: false, data_url: 'url', error_message: undefined },
      entityStatusId: extractionKey.entityStatusId,
      tenantName: extractionKey.tenantName,
      userId: extractionKey.userId,
    };

    await expect(job.handleDispatch(jest.fn(), params)).rejects.toBeInstanceOf(
      NonRetryableJobError
    );

    const extractions = await testingEnvironment.db.getAllFrom(mongoPXEntitiesStatusCollection);
    expect(extractions).toMatchObject([{ _id: extractionDBO._id, status: EntityStatus.Error }]);
  });
});
