import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoTransactionManager } from '../MongoTransactionManager';
import { DefaultTransactionManager, DefaultIdGenerator } from '../data_source_defaults';

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
