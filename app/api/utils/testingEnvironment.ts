import { appContext } from 'api/utils/AppContext';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { testingTenants } from 'api/utils/testingTenants';
import { elasticTesting } from 'api/utils/elastic_testing';
import { UserSchema } from 'shared/types/userType';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import { setupTestUploadedPaths } from 'api/files';

async function setTenant() {
  testingTenants.mockCurrentTenant({
    name: testingDB.dbName || 'defaultDB',
    dbName: testingDB.dbName || 'defaultDB',
    indexName: 'index',
  });
  await setupTestUploadedPaths();
}

async function setFixtures(fixtures?: DBFixture) {
  if (fixtures) {
    await testingDB.connect();
    await testingDB.clearAllAndLoadFixtures(fixtures);
  }
}

async function setElastic(elasticIndex?: string) {
  if (elasticIndex) {
    testingTenants.changeCurrentTenant({ indexName: elasticIndex });
    await elasticTesting.reindex();
  }
}

function setPermissions(user?: UserSchema) {
  const userInContextMockFactory = new UserInContextMockFactory();
  if (!user) {
    userInContextMockFactory.mockEditorUser();
  } else {
    userInContextMockFactory.mock(user);
  }
}

const testingEnvironment = {
  async setUp(fixtures?: DBFixture, elasticIndex?: string) {
    await setTenant();
    await setFixtures(fixtures);
    await setElastic(elasticIndex);
    setPermissions();
    this.setRequestId();
  },

  setRequestId(requestId: string = '1234') {
    jest
      .spyOn(appContext, 'get')
      .mockImplementation(key => (key === 'requestId' ? requestId : null));
  },
  async tearDown() {
    await testingDB.disconnect();
  },
};

export { testingEnvironment };
