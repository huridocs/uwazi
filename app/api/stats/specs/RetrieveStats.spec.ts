import { RetrieveStats } from 'api/stats/application/RetrieveStats';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { fixtures } from 'api/stats/specs/fixtures';
import testingDB from 'api/utils/testing_db';
import { elastic } from 'api/search/elastic';

describe('RetrieveStats', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures, 'stats');
  });

  afterAll(async () => testingEnvironment.tearDown());

  it('calculates the aggregated stats ', async () => {
    const elasticMock = jest
      .spyOn(elastic.cat, 'indices')
      // @ts-ignore
      .mockResolvedValue({ body: [{ 'store.size': 5000 }] });
    const { db } = await testingDB.connect();
    jest.spyOn(db, 'stats').mockResolvedValue({
      db: 'uwazi_testing',
      collections: 4,
      views: 0,
      objects: 16,
      avgObjSize: 134.6875,
      dataSize: 2155,
      storageSize: 15000,
      numExtents: 0,
      indexes: 4,
      indexSize: 15000,
      scaleFactor: 1,
      fsUsedSize: 28738330624,
      fsTotalSize: 62671097856,
      ok: 1,
    });
    const actionResult = await new RetrieveStats(db).execute();

    expect(elasticMock).toHaveBeenCalledWith({
      pretty: true,
      format: 'application/json',
      bytes: 'b',
      h: 'store.size',
    });
    expect(actionResult).toEqual({
      users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
      entities: { total: 10 },
      files: { total: 2 },
      storage: { total: 30000 },
    });
  });
});
