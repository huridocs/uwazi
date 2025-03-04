import { appContext } from 'api/utils/AppContext';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { testingTenants } from 'api/utils/testingTenants';
import { elasticTesting } from 'api/utils/elastic_testing';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import { setupTestUploadedPaths } from 'api/files';
import { UserSchema } from 'shared/types/userType';

let appContextGetMock: jest.SpyInstance<unknown, [key: string], any>;
let appContextSetMock: jest.SpyInstance<unknown, [key: string, value: unknown], any>;

const testingEnvironment = {
  userInContextMockFactory: new UserInContextMockFactory(),

  async setUp(fixtures?: DBFixture, elasticIndex?: string) {
    await this.setTenant();
    this.setPermissions();
    this.setFakeContext();
    await this.setFixtures(fixtures);
    await this.setElastic(elasticIndex);
  },

  async setTenant(name?: string, subPath = '') {
    testingTenants.mockCurrentTenant({
      name: name || testingDB.dbName || 'defaultDB',
      dbName: testingDB.dbName || name || 'defaultDB',
      indexName: 'index',
    });
    await setupTestUploadedPaths(subPath);
  },

  setFakeContext() {
    if (!jest.isMockFunction(appContext.get)) {
      const originalAppContextGet = appContext.get.bind(appContext);
      appContextGetMock = jest.spyOn(appContext, 'get').mockImplementation((key: string) => {
        if (key === 'mongoSession' || key === 'fileOperations' || key === 'reindexOperations') {
          return undefined;
        }
        return originalAppContextGet(key);
      });
      appContextSetMock = jest.spyOn(appContext, 'set').mockImplementation(() => {});
    }
  },

  unsetFakeContext() {
    if (jest.isMockFunction(appContext.get)) {
      appContextGetMock.mockRestore();
    }
    if (jest.isMockFunction(appContext.set)) {
      appContextSetMock.mockRestore();
    }
  },

  async setFixtures(fixtures?: DBFixture) {
    if (fixtures) {
      await testingDB.setupFixturesAndContext(fixtures);
    }
  },

  async setElastic(elasticIndex?: string) {
    if (elasticIndex) {
      testingTenants.changeCurrentTenant({ indexName: elasticIndex });
      await elasticTesting.reindex();
    }
  },

  setPermissions(user?: UserSchema) {
    if (!user) {
      this.userInContextMockFactory.mockEditorUser();
    } else {
      this.userInContextMockFactory.mock(user);
    }
  },

  resetPermissions() {
    this.userInContextMockFactory.restore();
  },

  setRequestId(requestId: string = '1234') {
    jest
      .spyOn(appContext, 'get')
      .mockImplementation(key => (key === 'requestId' ? requestId : null));
  },

  async tearDown() {
    await testingDB.disconnect();
  },

  db: {
    async getAllFrom(collectionName: string) {
      return testingDB.mongodb?.collection(collectionName).find().toArray();
    },
  },
};

export { testingEnvironment };
