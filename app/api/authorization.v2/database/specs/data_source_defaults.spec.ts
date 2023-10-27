import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultPermissionsDataSource } from '../data_source_defaults';
import { MongoPermissionsDataSource } from '../MongoPermissionsDataSource';

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
