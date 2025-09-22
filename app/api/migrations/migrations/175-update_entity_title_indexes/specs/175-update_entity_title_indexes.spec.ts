import { Db } from 'mongodb';

import testingDB from 'api/utils/testing_db';
import migration from '../index';
import { Fixture } from '../types';
import { fixtures } from './fixtures';

let db: Db | null;

const initTest = async (fixture: Fixture) => {
  await testingDB.setupFixturesAndContext(fixture);
  db = testingDB.mongodb!;
  await migration.up(db);
};

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

describe('migration test', () => {
  beforeAll(async () => {
    await initTest(fixtures);
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(175);
  });

  it('should check if a reindex is needed', async () => {
    expect(migration.reindex).toBe(false);
  });

  it('should add hashed index on entities title', async () => {
    const indexes = await db?.collection('entities').listIndexes().toArray();
    const hashedIndex = indexes?.find(idx => 
      idx.key && idx.key.title === 'hashed'
    );
    expect(hashedIndex).toBeDefined();
    expect(hashedIndex?.key).toEqual({ title: 'hashed' });
  });

  it('should remove text index from entities title', async () => {
    const indexes = await db?.collection('entities').listIndexes().toArray();
    const textIndex = indexes?.find(idx => 
      idx.key && idx.key.title === 'text'
    );
    expect(textIndex).toBeUndefined();
  });
});
