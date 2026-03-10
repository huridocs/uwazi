import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';

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
  const mongoTransactionManager = TransactionManagerFactory.default();

  const settingsDS = SettingsDataSourceFactory.default(mongoTransactionManager);
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
