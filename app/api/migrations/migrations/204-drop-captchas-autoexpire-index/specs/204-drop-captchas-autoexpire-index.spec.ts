import { Db, ObjectId } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';

let db: Db | null;

const legacyId = new ObjectId();
const v2Id = new ObjectId();

const seed = async () => {
  await db!.collection('captchas').deleteMany({});
  await db!.collection('captchas').insertMany([
    { _id: legacyId, text: 'l3g4cy', autoexpire: new Date() },
    { _id: v2Id, text: 'v2v2', createdAt: new Date() },
  ]);
};

const listIndexNames = async () => {
  const indexes = await db!.collection('captchas').listIndexes().toArray();
  return indexes.map(index => index.name);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
  await testingDB.setupFixturesAndContext({});
  db = testingDB.mongodb!;
});

beforeEach(async () => {
  await seed();
  await db!.collection('captchas').createIndex({ autoexpire: 1 }, { expireAfterSeconds: 36000 });
  await db!.collection('captchas').createIndex({ createdAt: 1 }, { expireAfterSeconds: 36000 });
});

afterEach(async () => {
  jest.clearAllMocks();
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('204-drop-captchas-autoexpire-index migration', () => {
  it('should have expected metadata', () => {
    expect(migration.delta).toBe(204);
    expect(migration.reindex).toBe(false);
  });

  it('should delete only the captchas left behind by v1', async () => {
    await migration.up(db!);

    const remaining = await db!.collection('captchas').find({}).toArray();

    expect(remaining).toHaveLength(1);
    expect(remaining[0]._id).toEqual(v2Id);
  });

  it('should drop the autoexpire index and keep the v2 createdAt index', async () => {
    await migration.up(db!);

    const names = await listIndexNames();

    expect(names).not.toContain('autoexpire_1');
    expect(names).toContain('createdAt_1');
  });

  it('should be idempotent', async () => {
    await migration.up(db!);
    await migration.up(db!);

    const names = await listIndexNames();
    const remaining = await db!.collection('captchas').find({}).toArray();

    expect(names).not.toContain('autoexpire_1');
    expect(names).toContain('createdAt_1');
    expect(remaining).toHaveLength(1);
  });

  it('should not throw when the autoexpire index was never created', async () => {
    await db!.collection('captchas').dropIndex('autoexpire_1');

    await expect(migration.up(db!)).resolves.not.toThrow();

    const names = await listIndexNames();
    expect(names).toContain('createdAt_1');
  });
});
