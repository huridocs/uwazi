import { Db } from 'mongodb';
import { config } from '#api/config.js';
import { TenantNotFound } from '#api/tenants/application/errors.js';
import { testingDB } from '#api/utils/testing_db.js';
import { GetTenantController } from '../GetTenantController.js';

const names = ['cli-get-a', 'cli-get-missing'];

describe('GetTenantController', () => {
  let db: Db;

  beforeAll(async () => {
    await testingDB.connect();
    db = testingDB.db(config.SHARED_DB);
  });

  afterAll(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await testingDB.tearDown();
  });

  beforeEach(async () => {
    await db.collection('tenants').deleteMany({ name: { $in: names } });
    await db.collection('tenants').insertOne({
      name: 'cli-get-a',
      dbName: 'cli-get-a',
      metadata: { orgName: 'Acme' },
    });
  });

  it('should print the whole row, operational data included', async () => {
    expect(await GetTenantController.handle({ name: 'cli-get-a' })).toEqual({
      name: 'cli-get-a',
      dbName: 'cli-get-a',
      metadata: { orgName: 'Acme' },
    });
  });

  it('should fail when there is no such tenant', async () => {
    await expect(GetTenantController.handle({ name: 'cli-get-missing' })).rejects.toThrow(
      TenantNotFound
    );
  });
});
