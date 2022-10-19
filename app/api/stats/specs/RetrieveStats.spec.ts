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
    // TODO elastic index size

    jest.spyOn(elastic.cat, 'indices').mockResolvedValue({ body: [{ 'store.size': 5000 }] });
    const action = new RetrieveStats(await testingDB.connect());

    expect(await action.execute()).toEqual({
      users: { total: 3, admin: 1, editor: 1, collaborator: 1 },
      entities: { total: 10 },
      files: { total: 2 },
      storage: { total: 15000 },
    });
  });
});
