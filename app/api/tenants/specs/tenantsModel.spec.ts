// oxlint-disable max-statements
import { config } from '#api/config.js';
import { Db, ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import waitForExpect from 'wait-for-expect';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import { TenantsModel, tenantsModel } from '../tenantsModel.js';

const modelTenantNames = [
  'model-tenant-one',
  'model-tenant-two',
  'model-tenant-three',
  'model-tenant-four',
];

const deleteModelTenants = async (database: Db) => {
  await database.collection('tenants').deleteMany({ name: { $in: modelTenantNames } });
};

describe('tenantsModel', () => {
  let db: Db;
  let model: TenantsModel;
  let errorEvent: Function;
  let mockChangeStream: { on: Function; close: Function };

  beforeAll(async () => {
    await testingDB.connect();
    testingEnvironment.setRequestId();
    db = testingDB.db(config.SHARED_DB);
  });

  beforeEach(async () => {
    model = await tenantsModel();
    await model.initialize();

    await deleteModelTenants(db);
    await db.collection('tenants').insertMany([
      {
        name: 'model-tenant-one',
        dbName: 'tenant_one',
        indexName: 'index name',
        uploadedDocuments: 'path',
        attachments: 'path',
        customUploads: 'path',
        activityLogs: 'path',
        stats: 'un-needed data',
        healthChecks: 'un-needed data',
        featureFlags: {
          s3Storage: false,
          esReplicas: 1,
        },
      },
      {
        name: 'model-tenant-two',
        dbName: 'tenant_two',
      },
    ]);
  });

  afterEach(async () => {
    await model.closeChangeStream();
  });

  afterAll(async () => {
    // await for the debounce to finish
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
    await testingEnvironment.tearDown();
  });

  describe('get()', () => {
    it('should return a list of current tenants (only properties required for tenant operation)', async () => {
      const tenants = await model.get();

      const tenantOne = tenants.find(t => t.name === 'model-tenant-one');
      const tenantTwo = tenants.find(t => t.name === 'model-tenant-two');

      expect(tenantOne).toEqual({
        _id: expect.any(ObjectId),
        name: 'model-tenant-one',
        dbName: 'tenant_one',
        indexName: 'index name',
        uploadedDocuments: 'path',
        attachments: 'path',
        customUploads: 'path',
        activityLogs: 'path',
        featureFlags: {
          s3Storage: false,
          esReplicas: 1,
        },
      });
      expect(tenantTwo).toEqual({
        _id: expect.any(ObjectId),
        name: 'model-tenant-two',
        dbName: 'tenant_two',
      });
    });
  });

  it('should require name', async () => {
    try {
      await db.collection('tenants').insertOne({ name: '' });
      await db.collection('tenants').insertOne({});
      fail('should fail with required error');
    } catch (e) {
      const validationFailed = 121;
      expect(e.code).toBe(validationFailed);
    }
  });

  it('should requiere a unique name for tenants', async () => {
    try {
      await model.model!.ensureIndexes();
      await db.collection('tenants').insertMany([
        {
          name: 'model-tenant-one',
        },
      ]);
      fail('should fail with duplicate key error');
    } catch (e) {
      const duplicateKeyError = 11000;
      expect(e.code).toBe(duplicateKeyError);
    }
    const tenants = await model.get();
    const names = tenants.map(tenant => tenant.name);
    expect(names.filter(name => name === 'model-tenant-one')).toHaveLength(1);
    expect(names).toContain('model-tenant-two');
  });

  it('should emit the new list after a change (1 emit per multiple changes)', async () => {
    const insertedNames = ['model-tenant-three', 'model-tenant-four'];
    const emissions: { name?: string }[][] = [];
    const mentions = (rows: { name?: string }[], name: string) =>
      rows.some(row => row.name === name);

    model.on('change', (data: { name?: string }[]) => {
      emissions.push(data);
    });

    await db.collection('tenants').insertMany([
      {
        name: 'model-tenant-three',
        dbName: 'tenant_three',
      },
      {
        name: 'model-tenant-four',
        dbName: 'tenant_four',
      },
    ]);

    await waitForExpect(async () => {
      const containsBoth = emissions.some(rows =>
        insertedNames.every(name => mentions(rows, name))
      );
      expect(containsBoth).toBe(true);
    });

    const firstMention = emissions.findIndex(rows =>
      insertedNames.some(name => mentions(rows, name))
    );
    const firstWithBoth = emissions.findIndex(rows =>
      insertedNames.every(name => mentions(rows, name))
    );
    expect(firstMention).toBe(firstWithBoth);
  });

  describe('on error', () => {
    it('watch not supported should close the connection', async () => {
      //Model.watch is not supported by Mongo in-memory used by the tests
      mockChangeStream = {
        on: (event: string, fn: Function) => {
          if (event === 'error') {
            errorEvent = fn;
          }
        },

        close: jest.fn(),
      };

      //@ts-ignore
      jest.spyOn(Model, 'watch').mockReturnValue(mockChangeStream);
      model = await tenantsModel();
      await model.initialize();
      errorEvent({
        message: 'The $changeStream stage is only supported on replica sets',
        code: 40573,
      });

      expect(mockChangeStream.close).toHaveBeenCalled();

      try {
        errorEvent({ message: 'something happened' });
      } catch (error) {
        expect(error.message).toBe('something happened');
        expect(error.code).toBe(500);
      }
    });
  });
});
