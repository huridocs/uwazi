import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import { appContext } from 'api/utils/AppContext';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { UserSchema } from 'shared/types/userType';
import { elasticTesting } from './elastic_testing';
import { testingTenants } from './testingTenants';

const appContextTestValues: { [k: string]: any } = {
  requestId: '1234',
};

interface TestingEnvironment {
  promises: Promise<any>[];
  appContextSpy: jest.SpyInstance | null;
  setUp: (fixtures: DBFixture, elasticIndex?: string) => Promise<void>;

  connect(): TestingEnvironment;
  disconnect(): void;

  withFixtures(fixtures: DBFixture): void;

  withElastic(elasticIndex: string): void;

  withContext(): any;

  withPermissions(): void;

  run(): void;
}

const testingEnvironment: TestingEnvironment = {
  promises: [],
  appContextSpy: null,
  async setUp(fixtures?: DBFixture, elasticIndex?: string) {
    if (fixtures) {
      this.connect();
      this.withFixtures(fixtures);
    }
    if (elasticIndex) {
      this.withElastic(elasticIndex);
    }
    this.withPermissions();
    this.withContext();
    await this.run();
  },

  async run() {
    await Promise.all(this.promises);
  },
  connect() {
    this.promises.push(testingDB.connect());
    return this;
  },
  async disconnect() {
    await testingDB.disconnect();
  },
  withFixtures(fixtures?: DBFixture) {
    if (fixtures) {
      this.promises.push(testingDB.clearAllAndLoad(fixtures));
    }
    return this;
  },
  withElastic(elasticIndex: string) {
    testingTenants.changeCurrentTenant({ indexName: elasticIndex });
    this.promises.push(elasticTesting.reindex());
    return this;
  },
  withPermissions(user?: UserSchema) {
    const userInContextMockFactory = new UserInContextMockFactory();
    if (!user) {
      userInContextMockFactory.mockEditorUser();
    } else {
      userInContextMockFactory.mock(user);
    }
    return this;
  },
  withContext(contextValues: { [k: string]: any } = appContextTestValues) {
    this.appContextSpy = jest
      .spyOn(appContext, 'get')
      .mockImplementation((key: string) => contextValues[key]);
    return this;
  },
};

export { testingEnvironment };
