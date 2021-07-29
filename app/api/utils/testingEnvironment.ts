import { appContext } from 'api/utils/AppContext';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { testingTenants } from 'api/utils/testingTenants';
import { elasticTesting } from 'api/utils/elastic_testing';
import { UserSchema } from 'shared/types/userType';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

class TestingEnvironment {
  private queue: Promise<void>;

  private appContextSpy: jest.SpyInstance | null = null;

  constructor() {
    this.queue = Promise.resolve();
  }

  async setUp(fixtures?: DBFixture, elasticIndex?: string) {
    await this.withTenant()
      .withFixtures(fixtures)
      .withElastic(elasticIndex)
      .withPermissions()
      .withRequestId();
  }

  async then(callback: (queue: Promise<any>) => {}) {
    callback(this.queue);
  }

  chain(callback: () => Promise<void>): void {
    this.queue = this.queue.then(callback);
  }

  withTenant() {
    this.chain(async () => {
      await testingTenants.mockCurrentTenant({
        name: testingDB.dbName || 'defaultDB',
        dbName: testingDB.dbName || 'defaultDB',
        indexName: 'index',
      });
    });

    return this;
  }

  withFixtures(fixtures?: DBFixture) {
    if (fixtures) {
      this.chain(async () => {
        await testingDB.connect();
        await testingDB.clearAllAndLoadFixtures(fixtures);
      });
    }
    return this;
  }

  withElastic(elasticIndex?: string) {
    if (elasticIndex) {
      testingTenants.changeCurrentTenant({ indexName: elasticIndex });
      this.chain(async () => {
        await elasticTesting.reindex();
      });
    }
    return this;
  }

  withPermissions(user?: UserSchema) {
    const userInContextMockFactory = new UserInContextMockFactory();
    if (!user) {
      userInContextMockFactory.mockEditorUser();
    } else {
      userInContextMockFactory.mock(user);
    }
    return this;
  }

  withRequestId(requestId: string = '1234') {
    this.appContextSpy = jest
      .spyOn(appContext, 'get')
      .mockImplementation(key => (key === 'requestId' ? requestId : null));
    return this;
  }

  async tearDown() {
    this.chain(async () => {
      await testingDB.disconnect();
    });
    return this;
  }
}

export const testingEnvironment = new TestingEnvironment();
