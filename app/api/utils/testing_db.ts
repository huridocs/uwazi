import mongoose, { Connection } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Db, ObjectId } from 'mongodb';
import { FileType } from 'shared/types/fileType';
import { EntitySchema } from 'shared/types/entityType';
import { DB } from 'api/odm';
import { tenants } from 'api/odm/tenantContext';
import { setupTestUploadedPaths } from 'api/files/filesystem';

import { testingTenants } from './testingTenants';

mongoose.Promise = Promise;
mongoose.set('useFindAndModify', false);

let connected = false;
let mongod: MongoMemoryServer;
let mongodb: Db;

export type DBFixture = {
  files?: FileType[];
  entities?: EntitySchema[];
  [k: string]: any;
};

const fixturer = {
  async clear(db: Db, _collections: string[] | undefined = undefined): Promise<void> {
    const collections: string[] =
      _collections || (await db.listCollections().toArray()).map(c => c.name);

    await Promise.all(
      collections.map(async c => {
        await db.collection(c).deleteMany({});
      })
    );
  },

  async clearAllAndLoad(db: Db, fixtures: DBFixture) {
    await this.clear(db);
    await Promise.all(
      Object.keys(fixtures).map(async collectionName => {
        await db.collection(collectionName).insertMany(fixtures[collectionName]);
      })
    );
  },
};

let mongooseConnection: Connection;

const initMongoServer = async () => {
  mongod = new MongoMemoryServer();
  const uri = await mongod.getUri();
  mongooseConnection = await DB.connect(uri);
  connected = true;
};

const testingDB: {
  mongodb: Db | null;
  connect: (options?: { defaultTenant: boolean } | undefined) => Promise<Connection>;
  disconnect: () => Promise<void>;
  id: (id?: string | undefined) => ObjectId;
  clear: (collections?: string[] | undefined) => Promise<void>;
  clearAllAndLoad: (fixtures: DBFixture) => Promise<void>;
  dbName: string;
} = {
  mongodb: null,
  dbName: '',

  async connect(options = { defaultTenant: true }) {
    if (!connected) {
      await initMongoServer();
      // mongo/mongoose types collisions
      //@ts-ignore
      mongodb = mongooseConnection.db;
      this.mongodb = mongodb;

      this.dbName = await mongod.getDbName();

      if (options.defaultTenant) {
        tenants.add(
          testingTenants.createTenant({
            name: this.dbName,
            dbName: this.dbName,
            indexName: 'index',
          })
        );
        testingTenants.mockCurrentTenant({
          name: this.dbName,
          dbName: this.dbName,
          indexName: 'index',
        });
        setupTestUploadedPaths();
      }
    }

    return mongooseConnection;
  },

  async disconnect() {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    testingTenants.restoreCurrentFn();
  },

  id(id = undefined) {
    return mongoose.Types.ObjectId(id);
  },

  async clear(collections = undefined) {
    await fixturer.clear(mongodb, collections);
  },

  async clearAllAndLoad(fixtures: DBFixture) {
    await this.connect();
    await fixturer.clearAllAndLoad(mongodb, fixtures);
  },
};

export { testingDB };

// deprecated, for backward compatibility
export default testingDB;
