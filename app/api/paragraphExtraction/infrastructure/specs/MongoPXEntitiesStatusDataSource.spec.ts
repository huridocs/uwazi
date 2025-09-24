// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/getConne... Remove this comment to see the full error message
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant.js';

import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.v2/database/data_s... Remove this comment to see the full error message
import { DefaultSettingsDataSource } from '../settings.v2/database/data_source_defaults.js';


import { testingEnvironment } from 'api/utils/testingEnvironment.js';

import { DBFixture } from 'api/utils/testing_db.js';
import { ObjectId } from 'mongodb';
// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/domain/... Remove this comment to see the full error message
import { EntityStatus } from '../paragraphExtraction/domain/PXEntityStatusModel.js';
// @ts-expect-error TS(2307): Cannot find module '../paragraphExtraction/domain/... Remove this comment to see the full error message
import { PXValidationError } from '../paragraphExtraction/domain/PXValidationError.js';
import { PXExtractorsQueryServiceFactory } from '../PXExtractorsQueryServiceFactory';
import {
  mongoPXEntitiesStatusCollection,
  MongoPXEntitiesStatusDataSource,
} from '../MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatusDBO } from '../MongoPXEntityStatusDBO';

const createSut = () => {
  const connection = getConnection();
  const mongoTransactionManager = DefaultTransactionManager();

  const settingsDS = DefaultSettingsDataSource(mongoTransactionManager);
  const extractorsQueryService = PXExtractorsQueryServiceFactory.createDefault({
    connection,
    transactionManager: mongoTransactionManager,
  });

  const sut = new MongoPXEntitiesStatusDataSource(
    connection,
    mongoTransactionManager,
    settingsDS,
    extractorsQueryService
  );

  return { sut };
};

const entityStatusDBO: MongoPXEntityStatusDBO = {
  _id: new ObjectId(),
  entitySharedId: 'entitySharedId',
  extractorId: new ObjectId(),
  status: EntityStatus.New,
};

const createFixtures = (): DBFixture => ({
  [mongoPXEntitiesStatusCollection]: [entityStatusDBO],
});

describe('MongoPXEntitiesStatusDataSource', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(createFixtures());
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should not create a EntityStatus if one already exists', async () => {
    const { sut } = createSut();
    await testingEnvironment.db.getCollection(mongoPXEntitiesStatusCollection)?.createIndex(
      {
        entitySharedId: 1,
        extractorId: 1,
      },
      { unique: true }
    );

    await expect(
      sut.createWithStatus({
        entitySharedId: entityStatusDBO.entitySharedId,
        extractorId: entityStatusDBO.extractorId.toString(),
        status: EntityStatus.New,
      })
    ).rejects.toMatchObject({
      code: PXValidationError.codes.CANNOT_CREATE_ENTITY_STATUS,
    });
  });
});
