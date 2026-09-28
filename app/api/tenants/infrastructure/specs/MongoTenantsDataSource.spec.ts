import type { Db } from 'mongodb';
import { config } from '#api/config.js';
import { testingDB } from '#api/utils/testing_db.js';
import { MongoTenantsDataSource } from '../MongoTenantsDataSource.js';

describe('MongoTenantsDataSource', () => {
  beforeAll(async () => {
    await testingDB.connect();
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should resolve the database on every call, so it survives a reconnect', async () => {
    const database = jest.fn((): Db => testingDB.db(config.SHARED_DB));
    const sut = new MongoTenantsDataSource(database);

    await sut.all();
    await sut.getByName('whatever');

    expect(database).toHaveBeenCalledTimes(2);
  });
});
