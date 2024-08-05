import { config } from 'api/config';
import { DB } from 'api/odm/DB';
import { Db, ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import waitForExpect from 'wait-for-expect';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { TenantsModel, tenantsModel } from '../tenantsModel';

describe('tenantsModel', () => {
  let db: Db;
  let model: TenantsModel;
  let changeEvent: Function;
  let errorEvent: Function;
  let mockChangeStream: { on: Function; close: Function };

  beforeAll(async () => {
    await testingDB.connect();
    testingEnvironment.setRequestId();
    db = DB.connectionForDB(config.SHARED_DB).db;
  });

  beforeEach(async () => {
    // Model.watch is not supported by Mongo in-memory used by the tests
    mockChangeStream = {
      on: (event: string, fn: Function) => {
        if (event === 'change') {
          changeEvent = fn;
        }
        if (event === 'error') {
          errorEvent = fn;
        }
      },
      close: jest.fn(),
    };

    //@ts-ignore
    jest.spyOn(Model, 'watch').mockReturnValue(mockChangeStream);
    model = await tenantsModel();

    await db.collection('tenants').deleteMany({});
    await db.collection('tenants').insertMany([
      {
        name: 'tenant one',
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
        },
      },
      {
        name: 'tenant two',
        dbName: 'tenant_two',
      },
    ]);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('get()', () => {
    it('should return a list of current tenants (only properties required for tenant operation)', async () => {
      const tenants = await model.get();

      const tenantOne = tenants.find(t => t.name === 'tenant one');
      const tenantTwo = tenants.find(t => t.name === 'tenant two');

      expect(tenantOne).toEqual({
        _id: expect.any(ObjectId),
        name: 'tenant one',
        dbName: 'tenant_one',
        indexName: 'index name',
        uploadedDocuments: 'path',
        attachments: 'path',
        customUploads: 'path',
        activityLogs: 'path',
        featureFlags: {
          s3Storage: false,
        },
      });
      expect(tenantTwo).toEqual({
        _id: expect.any(ObjectId),
        name: 'tenant two',
        dbName: 'tenant_two',
      });
    });
  });

  it('should emit the new list after a change', async () => {
    let list = [];

    model.on('change', data => {
      list = data;
    });

    await db.collection('tenants').insertMany([
      {
        name: 'tenant three',
        dbName: 'tenant_three',
      },
    ]);

    changeEvent();

    await waitForExpect(async () => {
      expect(list.length).toEqual(3);
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
          name: 'tenant one',
        },
      ]);
    } catch (e) {
      const duplicateKeyError = 11000;
      expect(e.code).toBe(duplicateKeyError);
    }
    const tenants = await model.get();
    expect(tenants).toMatchObject([{ name: 'tenant one' }, { name: 'tenant two' }]);
  });

  describe('on error', () => {
    it('watch not supported should close the connection', () => {
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
