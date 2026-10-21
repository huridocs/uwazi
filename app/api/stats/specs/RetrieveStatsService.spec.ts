import { Db } from 'mongodb';
import { RetrieveStatsService } from '#api/stats/services/RetrieveStatsService.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { fixtures } from '#api/stats/specs/fixtures.js';
import { testingDB } from '#api/utils/testing_db.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';
import { UsersQueryServiceFactory } from '#api/core/infrastructure/factories/UsersQueryServiceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoEntitiesDAO } from '#api/core/infrastructure/mongodb/entity/MongoEntitiesDAO.js';
import { AccessContext } from '#api/core/domain/entityAccessPolicy/AccessContext.js';
import { User } from '#api/users.v2/model/User.js';

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('RetrieveStats', () => {
  let db: Db;

  beforeAll(async () => {
    db = (await testingDB.connect()).db as Db;
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: {
          postgresCore: usePostgres,
        },
      });
      await testingEnvironment.setFixtures(fixtures);
    });

    const createSut = () =>
      testingEnvironment.runWithContext(() => {
        const entitiesDAO = new MongoEntitiesDAO(db, TransactionManagerFactory.default(), {
          accessContext: AccessContext.forActor(new User('admin', 'admin', [])),
        });
        return new RetrieveStatsService(
          FilesDAOFactory.default(),
          entitiesDAO,
          UsersQueryServiceFactory.default()
        );
      });

    it('calculates the aggregated stats when collection has files', async () => {
      const stats = await createSut().execute('en');

      expect(stats).toEqual({
        users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
        entities: { total: 5 },
        files: { total: 2 },
        storage: { total: 10000 },
      });
    });

    it('calculates the aggregated stats when collection has no files', async () => {
      await testingEnvironment.setFixtures({ ...fixtures, files: [] });

      const stats = await createSut().execute('en');

      expect(stats).toEqual({
        users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
        entities: { total: 5 },
        files: { total: 0 },
        storage: { total: 0 },
      });
    });
  });
});
