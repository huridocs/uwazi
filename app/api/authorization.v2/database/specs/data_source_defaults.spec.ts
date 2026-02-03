import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DefaultPermissionsDataSource } from '../data_source_defaults.js';
import { MongoPermissionsDataSource } from '../MongoPermissionsDataSource.js';

beforeAll(async () => {
  await testingEnvironment.setUp({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('data_source_defaults', () => {
  describe('DefaultPermissionsDataSource', () => {
    it('should return a MongoPermissionsDataSource', () => {
      expect(DefaultPermissionsDataSource()).toBeInstanceOf(MongoPermissionsDataSource);
    });
  });
});
