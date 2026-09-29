import { TestUtils } from '#api/common.v2/utils/Test.js';
import { EntitiesDAO } from '#api/core/application/contracts/EntitiesDAO.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoRelationshipsV1DataSource } from '../MongoRelationshipsV1DataSource.js';

describe('MongoRelationshipsV1DataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should resolve the default language from the injected settings data source', async () => {
    const settingsDS = TestUtils.mockClass<SettingsDataSource>({
      getDefaultLanguageKey: jest.fn().mockResolvedValue('en'),
    });
    const entitiesDAO = TestUtils.mockClass<EntitiesDAO>({
      find: jest.fn().mockResolvedValue([]),
    });

    const dataSource = new MongoRelationshipsV1DataSource(
      getConnection(),
      TransactionManagerFactory.fake(),
      entitiesDAO,
      settingsDS
    );

    await dataSource.getByEntitySharedIds(['missing']);

    expect(settingsDS.getDefaultLanguageKey).toHaveBeenCalled();
    expect(entitiesDAO.find).toHaveBeenCalledWith(
      expect.objectContaining({ language: 'en', sharedIds: [] })
    );
  });
});
