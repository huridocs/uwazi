import { Db } from 'mongodb';
import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';

let db: Db | null;

const ttlIndex = async () => {
  const indexes = await db!.collection('passwordrecoveries').listIndexes().toArray();
  return indexes.find(index => index.key.expiresAt === 1);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
  await testingDB.setupFixturesAndContext({});
  db = testingDB.mongodb!;
});

beforeEach(async () => {
  // the collection does not exist until something writes to it
  await db!
    .collection('passwordrecoveries')
    .drop()
    .catch(() => null);
});

afterEach(async () => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('203-password-recoveries-ttl-index migration', () => {
  it('should have expected metadata', () => {
    expect(migration.delta).toBe(203);
    expect(migration.reindex).toBe(false);
  });

  it('should create the TTL index when the collection has none', async () => {
    await migration.up(db!);

    expect((await ttlIndex())?.expireAfterSeconds).toBe(0);
  });

  it('should replace the mongoose created index that expired 24 hours late', async () => {
    await db!
      .collection('passwordrecoveries')
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

    await migration.up(db!);

    const indexes = await db!.collection('passwordrecoveries').listIndexes().toArray();
    expect(indexes.filter(index => index.key.expiresAt === 1)).toHaveLength(1);
    expect((await ttlIndex())?.expireAfterSeconds).toBe(0);
  });

  it('should be idempotent', async () => {
    await migration.up(db!);
    await migration.up(db!);

    expect((await ttlIndex())?.expireAfterSeconds).toBe(0);
  });
});
