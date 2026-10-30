/* eslint-disable max-statements */
import { Db } from 'mongodb';

import { testingDB } from '#api/utils/testing_db.js';
import migration from '../index.js';

let db: Db;

beforeAll(async () => {
  jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterAll(async () => {
  await testingDB.tearDown();
});

const run = async (settings: Record<string, unknown>[]) => {
  await testingDB.setupFixturesAndContext({ settings });
  db = testingDB.mongodb!;
  migration.reindex = true;
  await migration.up(db);
};

describe('migration unset-new-name-generation', () => {
  it('should have a delta number', () => {
    expect(migration.delta).toBe(216);
  });

  it('should remove newNameGeneration and not request a reindex', async () => {
    await run([{ newNameGeneration: true, site_name: 'kept' }]);
    const settings = await db.collection('settings').findOne({});

    expect(settings).not.toHaveProperty('newNameGeneration');
    expect(settings?.site_name).toBe('kept');
    expect(migration.reindex).toBe(false);
  });

  it('should leave a settings document that has no flag', async () => {
    await run([{ site_name: 'kept' }]);
    const settings = await db.collection('settings').findOne({});

    expect(settings).not.toHaveProperty('newNameGeneration');
    expect(settings?.site_name).toBe('kept');
  });
});
