import { Db } from 'mongodb';
import { RetrieveStatsService } from '#api/stats/services/RetrieveStatsService.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { fixtures } from '#api/stats/specs/fixtures.js';
import testingDB from '#api/utils/testing_db.js';
import { elastic } from '#api/search/elastic.js';

describe('RetrieveStats', () => {
  let elasticMock: jest.SpyInstance;
  let db: Db;

  beforeAll(async () => {
    db = (await testingDB.connect()).db as Db;
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
    const stats = await new RetrieveStatsService(db).execute('en');

    expect(stats).toEqual({
      users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
      entities: { total: 5 },
      files: { total: 2 },
      storage: { total: 30000 },
    });
  });

  it('calculates the aggregated stats when collection has no files', async () => {
    await db.collection('files').deleteMany({});

    const stats = await new RetrieveStatsService(db).execute('en');

    expect(stats).toEqual({
      users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
      entities: { total: 5 },
      files: { total: 0 },
      storage: { total: 20000 },
    });
  });

  it('retrieves elastic stats with proper format', async () => {
    await new RetrieveStatsService(db).execute('en');

    expect(elasticMock).toHaveBeenCalledWith({
      pretty: true,
      bytes: 'b',
      h: 'store.size',
    });
  });
});
