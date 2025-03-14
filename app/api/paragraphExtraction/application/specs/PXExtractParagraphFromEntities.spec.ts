import { ObjectId } from 'mongodb';

import { DBFixture } from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import {
  mongoPXExtractionsCollection,
  MongoPXExtractionsDataSource,
} from 'api/paragraphExtraction/infrastructure/MongoPXExtractionsDataSource';
import { ExtractionStatus } from 'api/paragraphExtraction/domain/PXExtraction';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { PXExtractParagraphsFromEntityJob } from 'api/paragraphExtraction/infrastructure/PXExtractParagraphsFromEntitiesJob';

import { entity, entity2, extractor } from './fixtures';
import { Input, PXExtractParagraphsFromEntities } from '../PXExtractParagraphFromEntities';

const createFixtures = (): DBFixture => ({});

const setUpUseCase = () => {
  const transaction = DefaultTransactionManager();
  const connection = getConnection();

  const extractionsDS = new MongoPXExtractionsDataSource(connection, transaction);
  const dispatcher: JobsDispatcher = {
    dispatch: jest.fn(),
  };

  const extractParagraphFromEntities = new PXExtractParagraphsFromEntities({
    extractionsDS,
    dispatcher,
    tenantName: 'any_tenant',
  });

  return {
    extractParagraphFromEntities,
    dispatcher,
  };
};

describe('PXExtractParagraphFromEntities', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create an Extraction for each Entity', async () => {
    const { extractParagraphFromEntities } = setUpUseCase();

    const input: Input = {
      extractorId: extractor._id.toString(),
      entitySharedIds: [entity.sharedId!, entity2.sharedId!],
      userId: new ObjectId().toString(),
    };

    await extractParagraphFromEntities.execute(input);

    const extractions = await testingEnvironment.db.getAllFrom(mongoPXExtractionsCollection);

    expect(extractions).toMatchObject([
      {
        extractorId: new ObjectId(input.extractorId),
        entitySharedId: input.entitySharedIds[0],
        status: ExtractionStatus.Queued,
      },
      {
        extractorId: new ObjectId(input.extractorId),
        entitySharedId: input.entitySharedIds[1],
        status: ExtractionStatus.Queued,
      },
    ]);
  });

  it('should dispatch PXExtractParagraphsFromEntityJob job for each Entity', async () => {
    const { extractParagraphFromEntities, dispatcher } = setUpUseCase();

    const input: Input = {
      extractorId: extractor._id.toString(),
      entitySharedIds: [entity.sharedId!, entity2.sharedId!],
      userId: new ObjectId().toString(),
    };

    await extractParagraphFromEntities.execute(input);

    expect(dispatcher.dispatch).toHaveBeenNthCalledWith(1, PXExtractParagraphsFromEntityJob, {
      entitySharedId: input.entitySharedIds[0],
      userId: input.userId,
      extractorId: input.extractorId,
      tenantName: 'any_tenant',
      extractionId: expect.any(String),
    });

    expect(dispatcher.dispatch).toHaveBeenNthCalledWith(2, PXExtractParagraphsFromEntityJob, {
      entitySharedId: input.entitySharedIds[1],
      userId: input.userId,
      extractorId: input.extractorId,
      tenantName: 'any_tenant',
      extractionId: expect.any(String),
    });
  });
});
