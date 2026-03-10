import { Db } from 'mongodb';
import testingDB from 'api/utils/testing_db';
import migration, { PUBLIC_USER_ID } from '../index';
import { fixtures } from './fixtures';

let db: Db | null;

describe('migration add-public-user', () => {
  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    await testingDB.setupFixturesAndContext(fixtures);
    db = testingDB.mongodb!;
    await migration.up(db);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(181);
  });

  it('should create the Public user', async () => {
    const publicUser = await db!.collection('users').findOne({ _id: PUBLIC_USER_ID });

    expect(publicUser).toBeDefined();
    expect(publicUser!.username).toBe('PublicUser');
    expect(publicUser!.email).toBe('public@uwazi.local');
    expect(publicUser!.role).toBe('collaborator');
    expect(publicUser!.password).toBeDefined();
  });

  it('should be idempotent', async () => {
    await expect(migration.up(db!)).resolves.not.toThrow();

    const publicUsers = await db!.collection('users').find({ _id: PUBLIC_USER_ID }).toArray();

    expect(publicUsers).toHaveLength(1);
  });
});
