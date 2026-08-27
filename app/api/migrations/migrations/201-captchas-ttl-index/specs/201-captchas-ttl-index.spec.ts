import { Db } from 'mongodb';
import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';

let db: Db | null;

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
  await testingDB.setupFixturesAndContext({});
  db = testingDB.mongodb!;
});

afterEach(async () => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('201-captchas-ttl-index migration', () => {
  it('should have expected metadata', () => {
    expect(migration.delta).toBe(201);
    expect(migration.reindex).toBe(false);
  });

  it('should create a TTL index on captchas.createdAt', async () => {
    await migration.up(db!);

    const indexes = await db?.collection('captchas').listIndexes().toArray();
    const ttlIndex = indexes?.find(index => index.key.createdAt === 1);

    expect(ttlIndex).toBeDefined();
    expect(ttlIndex?.expireAfterSeconds).toBe(36000);
  });

  it('should be idempotent', async () => {
    await migration.up(db!);
    await migration.up(db!);

    const indexes = await db?.collection('captchas').listIndexes().toArray();
    const ttlIndex = indexes?.find(index => index.key.createdAt === 1);

    expect(ttlIndex).toBeDefined();
    expect(ttlIndex?.expireAfterSeconds).toBe(36000);
  });
});
