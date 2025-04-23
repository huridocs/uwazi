import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';

import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DBFixture } from 'api/utils/testing_db';
import { ObjectId } from 'mongodb';
import { EntityStatus } from 'api/paragraphExtraction/domain/PXEntityStatusModel';
import { PXValidationError } from 'api/paragraphExtraction/domain/PXValidationError';
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
      sut.createAsNew({
        entitySharedId: entityStatusDBO.entitySharedId,
        extractorId: entityStatusDBO.extractorId.toString(),
      })
    ).rejects.toMatchObject({
      code: PXValidationError.codes.CANNOT_CREATE_ENTITY_STATUS,
    });
  });
});
