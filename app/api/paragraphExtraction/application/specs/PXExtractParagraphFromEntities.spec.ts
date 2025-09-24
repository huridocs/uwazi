import { ObjectId } from 'mongodb';


import { DBFixture } from 'api/utils/testing_db.js';

import { testingEnvironment } from 'api/utils/testingEnvironment.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';
// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/infrast... Remove this comment to see the full error message
import { PXEntitiesStatusDataSourceFactory } from '../paragraphExtraction/infrastructure/PXEntityStatusDataSourceFactory.js';
// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/infrast... Remove this comment to see the full error message
import { PXExtractParagraphsFromEntityJob } from '../paragraphExtraction/infrastructure/PXExtractParagraphsFromEntityJob.js';

// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/infrast... Remove this comment to see the full error message
import { mongoPXEntitiesStatusCollection } from '../paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource.js';
// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/domain/... Remove this comment to see the full error message
import { EntityStatus } from '../paragraphExtraction/domain/PXEntityStatusModel.js';
// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/infrast... Remove this comment to see the full error message
import { MongoPXEntityStatusDBO } from '../paragraphExtraction/infrastructure/MongoPXEntityStatusDBO.js';

import { entity1, entity2, extractor } from './fixtures';
import { Input, PXExtractParagraphsFromEntities } from '../PXExtractParagraphFromEntities';

const mongoEntityStatus1: MongoPXEntityStatusDBO = {
  _id: new ObjectId(),
  entitySharedId: entity1.sharedId!,
  extractorId: extractor._id,
  status: EntityStatus.New,
};

const mongoEntityStatus2: MongoPXEntityStatusDBO = {
  _id: new ObjectId(),
  entitySharedId: entity2.sharedId!,
  extractorId: extractor._id,
  status: EntityStatus.New,
};

const mongoEntityStatus3: MongoPXEntityStatusDBO = {
  _id: new ObjectId(),
  entitySharedId: new ObjectId().toString(),
  extractorId: extractor._id,
  status: EntityStatus.ProcessingObsolete,
};

const createFixtures = (): DBFixture => ({
  [mongoPXEntitiesStatusCollection]: [mongoEntityStatus1, mongoEntityStatus2],
});

const setUpUseCase = () => {
  const mongoTransactionManager = DefaultTransactionManager();
  const connection = getConnection();

  const entitiesStatusDS = PXEntitiesStatusDataSourceFactory.createDefault({
    connection,
    mongoTransactionManager,
  });
  const dispatcher: JobsDispatcher = {
    dispatch: jest.fn(),
  };

  const extractParagraphFromEntities = new PXExtractParagraphsFromEntities({
    entitiesStatusDS,
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

  it('should dispatch PXExtractParagraphsFromEntityJob job for each Entity', async () => {
    const { extractParagraphFromEntities, dispatcher } = setUpUseCase();

    const input: Input = {
      extractorId: extractor._id.toString(),
      entitySharedIds: [entity1.sharedId!, entity2.sharedId!],
      userId: new ObjectId().toString(),
    };

    await extractParagraphFromEntities.execute(input);

    expect(dispatcher.dispatch).toHaveBeenNthCalledWith(1, PXExtractParagraphsFromEntityJob, {
      entitySharedId: input.entitySharedIds[0],
      userId: input.userId,
      extractorId: input.extractorId,
      tenantName: 'any_tenant',
      entityStatusId: expect.any(String),
    });

    expect(dispatcher.dispatch).toHaveBeenNthCalledWith(2, PXExtractParagraphsFromEntityJob, {
      entitySharedId: input.entitySharedIds[1],
      userId: input.userId,
      extractorId: input.extractorId,
      tenantName: 'any_tenant',
      entityStatusId: expect.any(String),
    });
  });

  it('should mark each EntityStatus as Processing', async () => {
    const { extractParagraphFromEntities } = setUpUseCase();

    const input: Input = {
      extractorId: extractor._id.toString(),
      entitySharedIds: [entity1.sharedId!, entity2.sharedId!],
      userId: new ObjectId().toString(),
    };

    await extractParagraphFromEntities.execute(input);

    const mongoEntitiesStatus = await testingEnvironment.db.getAllFrom(
      mongoPXEntitiesStatusCollection
    );

    expect(mongoEntitiesStatus).toMatchObject([
      {
        _id: expect.any(ObjectId),
        entitySharedId: entity1.sharedId,
        extractorId: extractor._id,
        status: EntityStatus.Processing,
      },
      {
        _id: expect.any(ObjectId),
        entitySharedId: entity2.sharedId,
        extractorId: extractor._id,
        status: EntityStatus.Processing,
      },
    ]);
  });

  it('should skip source entity while processing', async () => {
    await testingEnvironment.setFixtures({
      ...createFixtures(),
      [mongoPXEntitiesStatusCollection]: [
        mongoEntityStatus1,
        { ...mongoEntityStatus2, status: EntityStatus.Processing },
        mongoEntityStatus3,
      ],
    });
    const { extractParagraphFromEntities, dispatcher } = setUpUseCase();

    const input: Input = {
      extractorId: extractor._id.toString(),
      entitySharedIds: [entity1.sharedId!, entity2.sharedId!, mongoEntityStatus3.entitySharedId],
      userId: new ObjectId().toString(),
    };

    await extractParagraphFromEntities.execute(input);

    expect(dispatcher.dispatch).toHaveBeenCalledTimes(1);

    expect(dispatcher.dispatch).toHaveBeenNthCalledWith(1, PXExtractParagraphsFromEntityJob, {
      entitySharedId: input.entitySharedIds[0],
      userId: input.userId,
      extractorId: input.extractorId,
      tenantName: 'any_tenant',
      entityStatusId: expect.any(String),
    });
  });
});
