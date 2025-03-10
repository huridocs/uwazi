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

import { entity, entity2, extractor } from './fixtures';
import { Input, PXExtractParagraphsFromEntities } from '../PXExtractParagraphFromEntities';
import { PXExtractParagraphsFromEntity } from '../PXExtractParagraphsFromEntity';

const createFixtures = (): DBFixture => ({});

const setUpUseCase = () => {
  const extractParagraphsFromEntity = {
    execute: jest.fn().mockResolvedValue(null),
  };

  const transaction = DefaultTransactionManager();
  const connection = getConnection();

  const extractionsDS = new MongoPXExtractionsDataSource(connection, transaction);

  const extractParagraphFromEntities = new PXExtractParagraphsFromEntities({
    extractParagraphsFromEntity:
      extractParagraphsFromEntity as any as PXExtractParagraphsFromEntity,
    extractionsDS,
  });

  return {
    extractParagraphFromEntities,
    extractParagraphsFromEntity,
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

  it('should call PXExtractParagraphsFromEntity use case with correct params', async () => {
    const { extractParagraphFromEntities, extractParagraphsFromEntity } = setUpUseCase();

    const input: Input = {
      extractorId: extractor._id.toString(),
      entitySharedIds: [entity.sharedId!, entity2.sharedId!],
      userId: new ObjectId().toString(),
    };

    await extractParagraphFromEntities.execute(input);

    expect(extractParagraphsFromEntity.execute).toHaveBeenCalledTimes(2);

    const [firstPayload] = extractParagraphsFromEntity.execute.mock.calls[0];

    const [secondPayload] = extractParagraphsFromEntity.execute.mock.calls[1];

    expect(firstPayload).toMatchObject({
      entitySharedId: input.entitySharedIds[0],
      extractorId: input.extractorId,
      userId: input.userId,
    });

    expect(secondPayload).toMatchObject({
      entitySharedId: input.entitySharedIds[1],
      extractorId: input.extractorId,
      userId: input.userId,
    });
  });
});
