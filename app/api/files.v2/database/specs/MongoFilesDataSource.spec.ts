import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { MongoFilesDataSource } from '../MongoFilesDataSource';

const factory = getFixturesFactory();

const fixtures = {
  files: [
    factory.file('file1', 'entity1', 'document', 'file1.pdf'),
    factory.file('file2', 'entity2', 'document', 'file2.pdf'),
    factory.file('file3', 'entity3', 'document', 'file3.pdf'),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('MongoFilesDataSource', () => {
  it('should return true if the file exists and belongs to the entity', async () => {
    const ds = new MongoFilesDataSource(getConnection(), DefaultTransactionManager());

    expect(
      await ds.filesExistForEntities([
        { entity: 'entity1', _id: factory.id('file1').toHexString() },
        { entity: 'entity2', _id: factory.id('file2').toHexString() },
      ])
    ).toBe(true);

    expect(
      await ds.filesExistForEntities([
        { entity: 'entity1', _id: factory.id('file3').toHexString() },
        { entity: 'entity2', _id: factory.id('file2').toHexString() },
      ])
    ).toBe(false);
  });
});
