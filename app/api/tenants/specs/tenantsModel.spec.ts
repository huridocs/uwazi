import { TenantsModel } from '../tenantsModel';
import { config } from 'api/config';
import { DB } from 'api/odm/DB';
import { Db, ObjectID } from 'mongodb';
import testingDB from 'api/utils/testing_db';
import { Model } from 'mongoose';

describe('tenantsModel', () => {
  let db: Db;
  let model: TenantsModel;
  let changeEvent: Function;

  beforeAll(async () => {
    await testingDB.connect({ defaultTenant: false });
    db = DB.connectionForDB(config.SHARED_DB).db;
  });

  beforeEach(async () => {
    // Model.watch is not supported by Mongo in-memory used by the tests
    spyOn(Model, 'watch').and.returnValue({
      on: (event: string, fn: Function) => {
        if (event === 'change') {
          changeEvent = fn;
        }
      },
      close: () => {},
    });
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
    await changeEvent();

    expect(list.length).toBe(3);
  });
});
