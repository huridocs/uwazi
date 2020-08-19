import { TenantsModel } from '../tenantsModel';
import { config } from 'api/config';
import { DB } from 'api/odm/DB';
import { Db, ObjectID } from 'mongodb';
import testingDB from 'api/utils/testing_db';
import { Model } from 'mongoose';
import waitForExpect from 'wait-for-expect';

describe('tenantsModel', () => {
  let db: Db;
  let model: TenantsModel;
  let changeEvent: Function;
  let errorEvent: Function;
  let mockChangeStream: { on: Function; close: Function };

  beforeAll(async () => {
    await testingDB.connect({ defaultTenant: false });
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

    spyOn(Model, 'watch').and.returnValue(mockChangeStream);
    model = new TenantsModel();

    await db.collection('tenants').deleteMany({});
    await db.collection('tenants').insertMany([
      {
        name: 'tenant one',
        dbName: 'tenant_one',
      },
      {
        name: 'tenant two',
        dbName: 'tenant_two',
      },
    ]);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  describe('get()', () => {
    it('should return a list of current tenants', async () => {
      const tenants = await model.get();

      expect(tenants).toEqual([
        expect.objectContaining({
          _id: expect.any(ObjectID),
          name: 'tenant one',
          dbName: 'tenant_one',
        }),
        expect.objectContaining({
          _id: expect.any(ObjectID),
          name: 'tenant two',
          dbName: 'tenant_two',
        }),
      ]);
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
