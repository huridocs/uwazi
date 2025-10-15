import { config } from 'api/config';
import { Db, ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import waitForExpect from 'wait-for-expect';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import testingDB from 'api/utils/testing_db';
import { TenantsModel, tenantsModel } from '../tenantsModel';

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
          esReplicas: 1,
        },
      },
      {
        name: 'tenant two',
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
          esReplicas: 1,
        },
      });
      expect(tenantTwo).toEqual({
        _id: expect.any(ObjectId),
        name: 'tenant two',
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

  it('should emit the new list after a change (1 emit per multiple changes)', async () => {
    let list = [];
    let changesEmitted = 0;

    model.on('change', data => {
      changesEmitted += 1;
      list = data;
    });

    await db.collection('tenants').insertMany([
      {
        name: 'tenant three',
        dbName: 'tenant_three',
      },
      {
        name: 'tenant four',
        dbName: 'tenant_four',
      },
    ]);

    await waitForExpect(async () => {
      expect(list.length).toEqual(4);
    });

    expect(changesEmitted).toBe(1);
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
