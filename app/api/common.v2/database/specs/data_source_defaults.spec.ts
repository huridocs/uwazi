import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import {
  DefaultTransactionManager,
  DefaultIdGenerator,
} from '#api/common.v2/database/data_source_defaults.js';

beforeAll(async () => {
  await testingEnvironment.setUp({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('data_source_defaults', () => {
  describe('DefaultTransactionManager', () => {
    it('should return a MongoTransactionManager', () => {
      expect(DefaultTransactionManager()).toBeInstanceOf(MongoTransactionManager);
    });
  });

  describe('DefaultIdGenerator', () => {
    it('should generate a string id', () => {
      expect(DefaultIdGenerator.generate()).toEqual(expect.any(String));
    });
  });
});
