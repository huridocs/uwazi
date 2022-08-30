import mongoose, { Connection } from 'mongoose';
import { Db } from 'mongodb';
import { FileType } from 'shared/types/fileType';
import { EntitySchema } from 'shared/types/entityType';
import { PageType } from 'shared/types/pageType';
import { DB } from 'api/odm';
import { setupTestUploadedPaths } from 'api/files/filesystem';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { UserGroupSchema } from 'shared/types/userGroupType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXSuggestionType } from 'shared/types/suggestionType';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import uniqueID from 'shared/uniqueID';
import { elasticTesting } from './elastic_testing';
import { testingTenants } from './testingTenants';
import { UserSchema } from '../../shared/types/userType';
import { Settings } from 'shared/types/settingsType';
import path from 'path';

mongoose.set('useFindAndModify', false);
mongoose.Promise = Promise;
let connected = false;
let mongodb: Db;

export type DBFixture = {
  files?: FileType[];
  entities?: EntitySchema[];
  dictionaries?: ThesaurusSchema[];
  usergroups?: UserGroupSchema[];
  pages?: PageType[];
  ixsuggestions?: IXSuggestionType[];
  users?: UserSchema[];
  settings?: Settings[];
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

const initMongoServer = async (dbName: string) => {
  const uri = 'mongodb://localhost/';
  mongooseConnection = await DB.connect(`${uri}${dbName}`);
  connected = true;
};

const testingDB: {
  mongodb: Db | null;
  dbName: string;
  UserInContextMockFactory: UserInContextMockFactory;
  connect: (options?: { defaultTenant: boolean } | undefined) => Promise<Connection>;
  disconnect: () => Promise<void>;
  tearDown: () => Promise<void>;
  id: (id?: string | undefined) => ObjectIdSchema;
  clear: (collections?: string[] | undefined) => Promise<void>;
  /**
   * @deprecated
   */
  clearAllAndLoad: (fixtures: DBFixture, elasticIndex?: string) => Promise<void>;
  setupFixturesAndContext: (
    fixtures: DBFixture,
    elasticIndex?: string,
    dbName?: string
  ) => Promise<void>;
  clearAllAndLoadFixtures: (fixtures: DBFixture, dbName?: string) => Promise<void>;
} = {
  mongodb: null,
  dbName: '',
  UserInContextMockFactory: new UserInContextMockFactory(),

  async connect(options = { defaultTenant: true }) {
    if (!connected) {
      this.dbName = `uwazi_testing_${uniqueID()}_${path
        .basename(expect.getState().testPath || '')
        .replace(/[.-]/g, '_')}`.substring(0, 63);
      await initMongoServer(this.dbName);
      mongodb = mongooseConnection.db;
      this.mongodb = mongodb;

      if (options.defaultTenant) {
        testingTenants.mockCurrentTenant({
          dbName: this.dbName,
          name: this.dbName,
          indexName: 'index',
        });
        await setupTestUploadedPaths();
      }
    }

    return mongooseConnection;
  },

  async tearDown() {
    await this.disconnect();
  },

  async disconnect() {
    if (this.mongodb) {
      await this.mongodb.dropDatabase();
    }
    await mongoose.disconnect();
    testingTenants.restoreCurrentFn();
  },

  id(id = undefined) {
    return mongoose.Types.ObjectId(id);
  },

  async clear(collections = undefined) {
    await fixturer.clear(mongodb, collections);
  },

  async setupFixturesAndContext(fixtures: DBFixture, elasticIndex?: string, dbName?: string) {
    await this.connect();
    let optionalMongo: Db | null = null;
    if (dbName) {
      optionalMongo = DB.connectionForDB(dbName).db;
    }
    await fixturer.clearAllAndLoad(optionalMongo || mongodb, fixtures);
    this.UserInContextMockFactory.mockEditorUser();

    if (elasticIndex) {
      testingTenants.changeCurrentTenant({ indexName: elasticIndex });
      await elasticTesting.reindex();
    }
  },

  /**
   * @deprecated
   */
  async clearAllAndLoad(fixtures: DBFixture, elasticIndex?: string) {
    await this.setupFixturesAndContext(fixtures, elasticIndex);
  },

  async clearAllAndLoadFixtures(fixtures: DBFixture) {
    await fixturer.clearAllAndLoad(mongodb, fixtures);
  },
};

export { testingDB, fixturer };

// deprecated, for backward compatibility
export default testingDB;
