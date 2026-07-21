import { Db } from 'mongodb';
import { RetrieveStatsService } from '#api/stats/services/RetrieveStatsService.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { fixtures } from '#api/stats/specs/fixtures.js';
import testingDB from '#api/utils/testing_db.js';
import { elastic } from '#api/search/elastic.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { FilesDAOFactory } from '#api/core/infrastructure/factories/FilesDAOFactory.js';

type TestConfig = {
  name: string;
  usePostgres: boolean;
};

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

describe('RetrieveStats', () => {
  let elasticMock: jest.SpyInstance;
  let db: Db;

  beforeAll(async () => {
    db = (await testingDB.connect()).db as Db;
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        featureFlags: { postgresFiles: usePostgres },
      });
      jest.spyOn(db, 'stats').mockResolvedValue({ storageSize: 15000 });
      elasticMock = jest
        .spyOn(elastic.cat, 'indices')
        .mockResolvedValue({ body: [{ 'store.size': '5000' }] } as any);
      await testingEnvironment.setFixtures(fixtures);
    });

    afterEach(() => {
      elasticMock.mockRestore();
    });

    const createSut = () =>
      testingEnvironment.runWithContext(
        () => new RetrieveStatsService(db, FilesDAOFactory.default())
      );

    it('calculates the aggregated stats when collection has files', async () => {
      const stats = await createSut().execute('en');

      expect(stats).toEqual({
        users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
        entities: { total: 5 },
        files: { total: 2 },
        storage: { total: 30000 },
      });
    });

    it('calculates the aggregated stats when collection has no files', async () => {
      await testingEnvironment.setFixtures({ ...fixtures, files: [] });

      const stats = await createSut().execute('en');

      expect(stats).toEqual({
        users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
        entities: { total: 5 },
        files: { total: 0 },
        storage: { total: 20000 },
      });
    });

    it('retrieves elastic stats with proper format', async () => {
      await createSut().execute('en');

      expect(elasticMock).toHaveBeenCalledWith({
        pretty: true,
        bytes: 'b',
        h: 'store.size',
      });
    });
  });
});
