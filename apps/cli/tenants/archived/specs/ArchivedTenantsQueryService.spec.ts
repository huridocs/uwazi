import { Db, ObjectId } from 'mongodb';
import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import { ArchivedTenantsQueryServiceFactory } from '../ArchivedTenantsQueryServiceFactory.js';

const archive = (name: string, archivedAt?: unknown) => ({
  _id: new ObjectId(),
  name,
  dbName: name,
  status: 'archived',
  dumpLocation: { db: `https://s3/${name}_db.zip`, files: `https://store/${name}` },
  featureFlags: { s3Storage: true },
  ...(archivedAt === undefined ? {} : { archivedAt }),
});

const fixtures = [
  archive('cli-archive-middle', 1700000200),
  archive('cli-archive-unreadable', 'not-a-date'),
  archive('cli-archive-oldest', '1700000100'),
  archive('cli-archive-missing'),
  archive('cli-archive-newest', '1700000300'),
  archive('cli-archive-tie-b', 1700000150),
  archive('cli-archive-tie-a', '1700000150'),
];

const names = fixtures.map(row => row.name);

describe('ArchivedTenantsQueryService', () => {
  let db: Db;

  const newestFirst = async () =>
    (await ArchivedTenantsQueryServiceFactory.default().newestFirst()).filter(row =>
      names.includes(row.name as string)
    );

  beforeAll(async () => {
    await testingDB.connect();
    db = testingDB.db(config.SHARED_DB);
  });

  afterAll(async () => {
    await db.collection('archives').deleteMany({ name: { $in: names } });
    await testingDB.tearDown();
  });

  beforeEach(async () => {
    await db.collection('archives').deleteMany({ name: { $in: names } });
    await db.collection('archives').insertMany(fixtures.map(row => ({ ...row })));
  });

  it('should return every row exactly as stored', async () => {
    const rows = await newestFirst();

    expect(rows).toHaveLength(fixtures.length);
    fixtures.forEach(stored => {
      expect(rows.find(row => row.name === stored.name)).toEqual(stored);
    });
  });

  it('should order by archivedAt, newest first, whether stored as a string or a number', async () => {
    expect((await newestFirst()).map(row => row.name)).toEqual([
      'cli-archive-newest',
      'cli-archive-middle',
      'cli-archive-tie-a',
      'cli-archive-tie-b',
      'cli-archive-oldest',
      'cli-archive-missing',
      'cli-archive-unreadable',
    ]);
  });
});
