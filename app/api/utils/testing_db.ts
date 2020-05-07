import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Db, ObjectId } from 'mongodb';
import { FileType } from 'shared/types/fileType';
import { EntitySchema } from 'shared/types/entityType';

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

const initMongoServer = async () => {
  mongod = new MongoMemoryServer();
  const uri = await mongod.getUri();
  await mongoose.connect(uri, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
  });
  connected = true;
};

const testingDB: {
  mongodb: Db | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  id: (id?: string | undefined) => ObjectId;
  clear: (collections?: string[] | undefined) => Promise<void>;
  clearAllAndLoad: (fixtures: DBFixture) => Promise<void>;
} = {
  mongodb: null,

  async connect() {
    if (!connected) {
      await initMongoServer();
      mongodb = mongoose.connections[0].db;
      this.mongodb = mongodb;
    }
  },

  async disconnect() {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
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

export default testingDB;
