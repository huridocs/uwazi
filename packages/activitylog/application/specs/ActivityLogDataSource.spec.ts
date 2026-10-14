import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ActivityLogDataSourceFactory } from '../../infrastructure/factories/ActivityLogDataSourceFactory.js';
import {
  idOf,
  seed,
  setUpBackends,
  storedIn,
  StoredEntry,
  testConfigs,
} from './ActivityLogContractFixtures.js';

/** In the order they are stored, which is not the order they were made in. */
const entries: StoredEntry[] = [
  { method: 'POST', url: '/api/third', time: 3_000, body: '{"a":1}', query: '{}', params: '{}' },
  { method: 'PUT', url: '/api/first', time: 1_000, username: 'admin' },
  { method: 'DELETE', url: '/api/second', time: 2_000, query: '{"_id":"x"}' },
  { method: 'POST', url: '/api/second-too', time: 2_000 },
];

describe('ActivityLogDataSource', () => {
  const dataSource = async <T>(
    use: (ds: ReturnType<typeof ActivityLogDataSourceFactory.default>) => Promise<T>
  ) => testingEnvironment.runWithContext(async () => use(ActivityLogDataSourceFactory.default()));

  beforeAll(async () => {
    await setUpBackends();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresCore }) => {
    beforeEach(async () => {
      await seed(postgresCore, entries);
    });

    describe('count()', () => {
      it('should count the entries the tenant holds', async () => {
        expect(await dataSource(async ds => ds.count())).toBe(4);
      });

      it('should count none when the tenant holds none', async () => {
        await seed(postgresCore, []);

        expect(await dataSource(async ds => ds.count())).toBe(0);
      });
    });

    describe('oldest()', () => {
      it('should return the oldest entries first, the first stored first among equals', async () => {
        const oldest = await dataSource(async ds => ds.oldest(3));

        expect(oldest.map(entry => entry.props.url)).toEqual([
          '/api/first',
          '/api/second',
          '/api/second-too',
        ]);
      });

      it('should return each entry as it was stored', async () => {
        const [first, , , third] = await dataSource(async ds => ds.oldest(10));

        expect(first.props).toEqual({
          id: idOf(1),
          method: 'PUT',
          url: '/api/first',
          params: null,
          query: null,
          body: null,
          userId: null,
          username: 'admin',
          time: 1_000,
        });
        expect(third.props).toMatchObject({
          id: idOf(0),
          params: '{}',
          query: '{}',
          body: '{"a":1}',
          username: null,
        });
      });

      it('should return every entry when asked for more than there are', async () => {
        expect(await dataSource(async ds => ds.oldest(10))).toHaveLength(4);
      });
    });

    describe('remove()', () => {
      it('should remove exactly the entries it is given', async () => {
        await dataSource(async ds => ds.remove(await ds.oldest(2)));

        expect((await storedIn(postgresCore)).map(entry => entry.url)).toEqual([
          '/api/second-too',
          '/api/third',
        ]);
      });

      it('should remove nothing when given no entries', async () => {
        await dataSource(async ds => ds.remove([]));

        expect(await storedIn(postgresCore)).toHaveLength(4);
      });
    });
  });
});
