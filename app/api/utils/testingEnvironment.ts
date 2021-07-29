import { appContext } from 'api/utils/AppContext';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { testingTenants } from 'api/utils/testingTenants';
import { elasticTesting } from 'api/utils/elastic_testing';
import { UserSchema } from 'shared/types/userType';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';

const appContextTestValues: { [k: string]: any } = {
  requestId: '1234',
};

class TestingEnvironment {
  private queue: Promise<void>;

  private appContextSpy: jest.SpyInstance | null = null;

  constructor() {
    this.queue = Promise.resolve();
  }

  async setUp(fixtures?: DBFixture, elasticIndex?: string) {
    await this.connect()
      .withFixtures(fixtures)
      .withElastic(elasticIndex)
      .withPermissions()
      .withContext();
  }

  async then(callback: (queue: Promise<any>) => {}) {
    callback(this.queue);
  }

  chain(callback: () => Promise<void>): void {
    this.queue = this.queue.then(callback);
  }

  connect = (options?: { defaultTenant: boolean }) => {
    this.chain(async () => {
      await testingDB.connect(options);
    });
    return this;
  };

  withFixtures(fixtures?: DBFixture) {
    if (fixtures) {
      this.chain(async () => {
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

  withContext(contextValues: { [k: string]: any } = appContextTestValues) {
    this.appContextSpy = jest
      .spyOn(appContext, 'get')
      .mockImplementation((key: string) => contextValues[key]);
    return this;
  }

  async disconnect() {
    this.chain(async () => {
      await testingDB.disconnect();
    });
    return this;
  }
}

export const testingEnvironment = new TestingEnvironment();
