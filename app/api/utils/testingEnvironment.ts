// eslint-disable-next-line node/no-restricted-import
import { copyFile } from 'fs/promises';
import { dirname } from 'path';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  cleanupTestUploadedPaths,
  createDirIfNotExists,
  setupTestUploadedPaths,
} from '#api/files/index.js';
import { FileType } from '#api/migrations/migrations/172-files_detect_and_assign_mimetype/types.js';
import { ExecutionContext, ExecutionContextDeps } from '#api/core/libs/ExecutionContext.js';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultDispatcher } from '#api/core/libs/queue/configuration/factories.js';
import { appContext } from '#api/utils/AppContext.js';
import { elasticTesting } from '#api/utils/elastic_testing.js';
import testingDB, { DBFixture } from '#api/utils/testing_db.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { UserInContextMockFactory } from '#api/utils/testingUserInContext.js';
import { User } from '#api/users.v2/model/User.js';
import { UserSchema } from '#shared/types/userType.js';
import { ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let appContextGetMock: jest.SpyInstance<unknown, [key: string], any>;
let appContextSetMock: jest.SpyInstance<unknown, [key: string, value: unknown], any>;

const testingEnvironment = {
  elasticIndex: '',
  uploadSubPath: '',
  userInContextMockFactory: new UserInContextMockFactory(),

  async setUp(fixtures?: DBFixture, elasticIndex?: string | boolean) {
    if (!elasticIndex) {
      this.elasticIndex = '';
    }
    await this.setTenant();
    this.setPermissions();
    this.setFakeContext();
    await this.setFixtures(fixtures);
    await this.setElastic(elasticIndex);
  },

  testingFilesPath(fileName: string) {
    return path.join(__dirname, `../files/specs/testing_files/${fileName}`);
  },

  async setupTenantTmpPaths(files: FileType[]) {
    const basePath = `/tmp/uwazi_upload_route${Date.now()}`;
    const uploadsPath = path.join(basePath, 'uploads');
    const customUploadsPath = path.join(basePath, 'customUploads');
    const segmentation = path.join(uploadsPath, 'segmentation');
    await createDirIfNotExists(uploadsPath);
    await createDirIfNotExists(segmentation);
    await createDirIfNotExists(customUploadsPath);

    const paths = {
      uploadedDocuments: uploadsPath,
      attachments: uploadsPath,
      customUploads: customUploadsPath,
      activityLogs: uploadsPath,
    };

    await files.reduce(async (prev, file) => {
      await prev;
      if (file.filename) {
        try {
          await copyFile(
            this.testingFilesPath(file.filename),
            path.join(file.type === 'custom' ? customUploadsPath : uploadsPath, file.filename)
          );
        } catch (e) {
          if (!e.message.match(/ENOENT/)) {
            throw e;
          }
        }
      }
    }, Promise.resolve());
    testingTenants.changeCurrentTenant(paths);
  },

  async setTenant(name?: string, subPath = '') {
    testingTenants.mockCurrentTenant({
      name: name || testingDB.dbName || 'defaultDB',
      dbName: testingDB.dbName || name || 'defaultDB',
      indexName: 'index',
      domain: '127.0.0.1',
    });
    await setupTestUploadedPaths(subPath);
    this.uploadSubPath = subPath;
  },

  async cleanupUploadPaths() {
    await cleanupTestUploadedPaths(this.uploadSubPath);
  },

  setFakeContext() {
    if (!jest.isMockFunction(appContext.get)) {
      const originalAppContextGet = appContext.get.bind(appContext);
      appContextGetMock = jest.spyOn(appContext, 'get').mockImplementation((key: string) => {
        if (
          key === 'mongoSession' ||
          key === 'fileOperations' ||
          key === 'reindexOperations' ||
          key === 'transactionManager'
        ) {
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

  async setElastic(elasticIndex?: string | boolean) {
    if (elasticIndex && !this.elasticIndex) {
      this.elasticIndex =
        elasticIndex === true
          ? `elasticsearch_test_index${process.pid}_${Date.now()}`
          : elasticIndex;
    }
    if (this.elasticIndex) {
      testingTenants.changeCurrentTenant({ indexName: this.elasticIndex });
      await elasticTesting.reindex();
    }
  },

  /**
   * @deprecated Use runWithContext instead, which includes tenant and actor in the ExecutionContext.
   */
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

  /**
   * Runs `fn` inside an ExecutionContext populated with test defaults.
   * Defaults: editor actor, tenant derived from testingDB, standard factory stubs.
   * Any field in `overrides` is deeply merged: `factories` keys are merged individually.
   */
  runWithContext<T>(
    fn: () => T,
    overrides?: Omit<Partial<ExecutionContextDeps>, 'factories'> & {
      factories?: Partial<ExecutionContextDeps['factories']>;
    }
  ): T {
    const tenant = testingTenants.createTenant({
      name: testingDB.dbName || 'defaultDB',
      dbName: testingDB.dbName || 'defaultDB',
      indexName: 'index',
      domain: '127.0.0.1',
    }) as ReturnType<typeof testingTenants.createTenant> & { domain: string };

    const defaultActor = User.createFrom({
      _id: new ObjectId(),
      role: 'editor',
      groups: [],
      email: 'editor@test.com',
      username: 'editorUser',
    });

    const defaultFactories: ExecutionContextDeps['factories'] = {
      transactionManager: TransactionManagerFactory.default,
      eventEmitter: EventEmitterFactory.forTesting,
      jobsDispatcher: () =>
        DefaultDispatcher(ExecutionContext.tenant.name, ExecutionContext.transactionManager),
      idGenerator: IdGeneratorFactory.default,
      logger: LoggerFactory.default,
      elasticClient: () => {
        throw new Error('ExecutionContext: elasticClient not implemented in test context');
      },
      authorizedEntityESClient: () => {
        throw new Error(
          'ExecutionContext: authorizedEntityESClient not implemented in test context'
        );
      },
    };

    const context: ExecutionContextDeps = {
      tenant: overrides?.tenant ?? tenant,
      actor: overrides?.actor ?? defaultActor,
      factories: { ...defaultFactories, ...overrides?.factories },
    };

    return ExecutionContext.run(context, fn);
  },

  setRequestId(requestId: string = '1234') {
    jest
      .spyOn(appContext, 'get')
      .mockImplementation(key => (key === 'requestId' ? requestId : null));
  },

  async tearDown() {
    if (this.elasticIndex) {
      try {
        await elasticTesting.deleteIndex(this.elasticIndex);
        this.elasticIndex = '';
      } catch (error) {
        console.warn(`Failed to cleanup Elasticsearch index ${this.elasticIndex}:`, error.message);
      }
    }
    await testingDB.disconnect();
  },

  db: {
    async getAllFrom(collectionName: string) {
      if (!testingDB.mongodb) {
        throw new Error('Testing mongodb not connected');
      }
      return testingDB.mongodb.collection(collectionName).find().toArray();
    },

    getCollection(collectionName: string) {
      return testingDB.mongodb?.collection(collectionName);
    },
  },
};

export { testingEnvironment };
