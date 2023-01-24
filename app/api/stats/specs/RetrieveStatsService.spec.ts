import { RetrieveStatsService } from 'api/stats/services/RetrieveStatsService';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from 'api/stats/specs/fixtures';
import testingDB from 'api/utils/testing_db';
import { elastic } from 'api/search/elastic';
import { Db } from 'mongodb';

describe('RetrieveStats', () => {
  let elasticMock: jest.SpyInstance;
  let db: Db;

  beforeAll(async () => {
    db = (await testingDB.connect()).db;
  });

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, 'stats');
    // @ts-ignore
    jest.spyOn(db, 'stats').mockResolvedValue({
      storageSize: 15000,
    });
    elasticMock = jest
      .spyOn(elastic.cat, 'indices')
      // @ts-ignore
      .mockResolvedValue({ body: [{ 'store.size': '5000' }] });
  });

  afterEach(() => {
    elasticMock.mockReset();
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('calculates the aggregated stats when collection has files', async () => {
    const stats = await new RetrieveStatsService(db).execute();

    expect(stats).toEqual({
      users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
      entities: { total: 10 },
      files: { total: 2 },
      storage: { total: 30000 },
    });
  });

  it('calculates the aggregated stats when collection has no files', async () => {
    await db.collection('files').deleteMany({});

    const stats = await new RetrieveStatsService(db).execute();

    expect(stats).toEqual({
      users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
      entities: { total: 10 },
      files: { total: 0 },
      storage: { total: 20000 },
    });
  });

  it('retrieves elastic stats with proper format', async () => {
    await new RetrieveStatsService(db).execute();

    expect(elasticMock).toHaveBeenCalledWith({
      pretty: true,
      format: 'application/json',
      bytes: 'b',
      h: 'store.size',
    });
  });
});
