import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';

import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { ObjectId } from 'mongodb';
import { EntityStatus } from '#api/paragraphExtraction/domain/PXEntityStatusModel.js';
import { PXValidationError } from '#api/paragraphExtraction/domain/PXValidationError.js';
import { PXExtractorsQueryServiceFactory } from '../PXExtractorsQueryServiceFactory.js';
import {
  mongoPXEntitiesStatusCollection,
  MongoPXEntitiesStatusDataSource,
} from '../MongoPXEntitiesStatusDataSource.js';
import { MongoPXEntityStatusDBO } from '../MongoPXEntityStatusDBO.js';

const createSut = () => {
  const connection = getConnection();
  const mongoTransactionManager = TransactionManagerFactory.default();

  const settingsDS = SettingsDataSourceFactory.default({
    transactionManager: mongoTransactionManager,
  });
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
