import { Db } from 'mongodb';
import testingDB from '#api/utils/testing_db.js';
import migration from '../index.js';

let db: Db | null;

const getIndex = async (collectionName: string, indexName: string) => {
  const indexes = await db?.collection(collectionName).listIndexes().toArray();
  return indexes?.find(index => index.name === indexName);
};

const createOldIndexes = async () => {
  const collection = db?.collection('users');
  await collection?.createIndex(
    { username: 1 },
    { name: 'username_1', unique: true, background: true }
  );
  await collection?.createIndex({ email: 1 }, { name: 'email_1', unique: true, background: true });
};

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

describe('198-update-user-indexes migration', () => {
  it('should have expected metadata', () => {
    expect(migration.delta).toBe(198);
    expect(migration.reindex).toBe(false);
  });

  // eslint-disable-next-line max-statements
  it('should replace existing username and email indexes with partialFilterExpression', async () => {
    await createOldIndexes();

    await migration.up(db!);

    const usernameIndex = await getIndex('users', 'username_1');
    const emailIndex = await getIndex('users', 'email_1');

    expect(usernameIndex).toBeDefined();
    expect(usernameIndex?.unique).toBe(true);
    expect(usernameIndex?.key).toEqual({ username: 1 });
    expect(usernameIndex?.partialFilterExpression).toEqual({ deletedAt: null });

    expect(emailIndex).toBeDefined();
    expect(emailIndex?.unique).toBe(true);
    expect(emailIndex?.key).toEqual({ email: 1 });
    expect(emailIndex?.partialFilterExpression).toEqual({ deletedAt: null });
  });
});
