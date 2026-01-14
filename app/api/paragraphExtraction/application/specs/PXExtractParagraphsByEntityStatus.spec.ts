import { ObjectId } from 'mongodb';

import { EntityStatus } from '../paragraphExtraction/domain/PXEntityStatusModel.js';

import { mongoPXEntitiesStatusCollection } from '../paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';

import { MongoPXEntityStatusDBO } from '../paragraphExtraction/infrastructure/MongoPXEntityStatusDBO.js';

import { DBFixture } from '#api/utils/testing_db.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { DefaultTransactionManager } from '#api/common.v2/database/data_source_defaults.js';

import { getConnection } from '#api/common.v2/database/getConnectionForCurrentTenant.js';

import { PXEntitiesStatusDataSourceFactory } from '../paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';

import { TestUtils } from '../common.v2/utils/Test.js';

import { PXExtractParagraphsByEntityStatus } from '../PXExtractParagraphsByEntityStatus';
import { PXExtractParagraphsFromEntities } from '../PXExtractParagraphFromEntities';

const extractor1 = new ObjectId();
const extractor2 = new ObjectId();

const mongoEntityStatus1: MongoPXEntityStatusDBO = {
  _id: new ObjectId(),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor1,
  status: EntityStatus.New,
};

const mongoEntityStatus2: MongoPXEntityStatusDBO = {
  _id: new ObjectId(),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor1,
  status: EntityStatus.New,
};

const mongoEntityStatus3: MongoPXEntityStatusDBO = {
  _id: new ObjectId(),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor1,
  status: EntityStatus.Obsolete,
};

const mongoEntityStatus4: MongoPXEntityStatusDBO = {
  _id: new ObjectId(),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor2,
  status: EntityStatus.New,
};

const createFixtures = (): DBFixture => ({
  [mongoPXEntitiesStatusCollection]: [
    mongoEntityStatus1,
    mongoEntityStatus2,
    mongoEntityStatus3,
    mongoEntityStatus4,
  ],
});

const setUpUseCase = () => {
  const mongoTransactionManager = TransactionManagerFactory.default();
  const connection = getConnection();
  const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });

  const extractParagraphsFromEntities = TestUtils.mockClass<PXExtractParagraphsFromEntities>({
    execute: jest.fn(),
  });

  const extractParagraphsByEntityStatus = new PXExtractParagraphsByEntityStatus({
    entitiesStatusDS,
    extractParagraphsFromEntities,
  });

  return { extractParagraphsByEntityStatus, extractParagraphsFromEntities };
};

describe('PXExtractParagraphsByEntityStatus', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should only extract paragraphs of EntityStatus of new', async () => {
    const { extractParagraphsByEntityStatus, extractParagraphsFromEntities } = setUpUseCase();

    const input = {
      userId: 'any_user_id',
      status: EntityStatus.New,
      extractorId: mongoEntityStatus1.extractorId.toString(),
    };

    await extractParagraphsByEntityStatus.execute(input);

    expect(extractParagraphsFromEntities.execute).toHaveBeenCalledWith({
      userId: input.userId,
      extractorId: input.extractorId,
      entitySharedIds: [mongoEntityStatus1.entitySharedId, mongoEntityStatus2.entitySharedId],
    });
  });
});
