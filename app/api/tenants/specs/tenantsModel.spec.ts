// oxlint-disable max-statements
import { config } from '#api/config.js';
import { Db } from 'mongodb';
import waitForExpect from 'wait-for-expect';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingDB } from '#api/utils/testing_db.js';
import * as errorHandler from '#api/utils/handleError.js';
import type { TenantsChangeFeed } from '../application/contracts/TenantsChangeFeed.js';
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
        name: 'model-tenant-two',
        dbName: 'tenant_two',
      });
    });
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
    it('should report a failed reload instead of rejecting in the background', async () => {
      let changeEvent: () => void = () => {};
      const feed: TenantsChangeFeed = {
        start: async onChange => {
          changeEvent = onChange;
        },
        stop: async () => {},
      };
      const failing = { all: jest.fn().mockRejectedValue(new Error('connection is gone')) };
      //@ts-ignore
      const failingModel = new TenantsModel(failing, feed);
      await failingModel.initialize();
      const handled = jest.spyOn(errorHandler, 'handleError').mockImplementation(() => undefined);

      changeEvent();
      await new Promise(resolve => {
        setTimeout(resolve, 1100);
      });

      expect(failing.all).toHaveBeenCalled();
      expect(handled).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'connection is gone' })
      );
      await failingModel.closeChangeStream();
      handled.mockRestore();
    });
  });
});
