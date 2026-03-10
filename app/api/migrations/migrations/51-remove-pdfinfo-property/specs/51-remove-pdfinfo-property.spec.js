import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove-pdfinfo-property', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(51);
  });

  describe('unset pdfInfo property', () => {
    beforeEach(async () => {
      await migration.up(testingDB.mongodb);
    });
    it('should remove pdfInfo property from entities and keep the rest of properties', async () => {
      const entities = await testingDB.mongodb.collection('entities').find({}).toArray();

      expect(entities).toMatchObject([
        { title: 'entity1', metadata: { text: [{ value: 'test' }] } },
        { title: 'entity2' },
        {
          title: 'entity3',
          published: true,
        },
      ]);
    });

    it('should remove pdfInfo property from files and keep the rest of properties', async () => {
      const filesWithoutPdfInfo = fixtures.files.map(file => {
        const { pdfInfo, ...fileWithoutPdfInfo } = file;
        return fileWithoutPdfInfo;
      });

      const files = await testingDB.mongodb.collection('files').find({}).toArray();

      expect(files).toEqual(filesWithoutPdfInfo);
    });
  });
});
