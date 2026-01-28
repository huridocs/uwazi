// eslint-disable-next-line node/no-restricted-import
import { copyFile } from 'fs/promises';

import { cleanupTestUploadedPaths, createDirIfNotExists, setupTestUploadedPaths } from 'api/files';
import { FileType } from 'api/migrations/migrations/172-files_detect_and_assign_mimetype/types';
import { appContext } from 'api/utils/AppContext';
import { elasticTesting } from 'api/utils/elastic_testing';
import testingDB, { DBFixture } from 'api/utils/testing_db';
import { testingTenants } from 'api/utils/testingTenants';
import { UserInContextMockFactory } from 'api/utils/testingUserInContext';
import path from 'path';
import { UserSchema } from 'shared/types/userType';

let appContextGetMock: jest.SpyInstance<unknown, [key: string], any>;
let appContextGetTelemetryCollectorMock: jest.SpyInstance<any>;
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

      appContextGetTelemetryCollectorMock = jest
        .spyOn(appContext, 'getTelemetryCollector')
        .mockImplementation();
    }
  },

  unsetFakeContext() {
    if (jest.isMockFunction(appContext.get)) {
      appContextGetMock.mockRestore();
    }
    if (jest.isMockFunction(appContext.set)) {
      appContextSetMock.mockRestore();
    }
    if (jest.isMockFunction(appContext.getTelemetryCollector)) {
      appContextGetTelemetryCollectorMock.mockRestore();
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
