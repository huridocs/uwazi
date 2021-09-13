import testingDB from 'api/utils/testing_db';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import migration from '../index.js';
import fixtures from './fixtures.js';

describe('migration remove-pdfinfo-property', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(51);
  });

  describe('unset pdfInfo property', () => {
    it('should remove pdfInfo property and keep the rest of properties', async () => {
      await migration.up(testingDB.mongodb);

      const entities = await testingDB.mongodb
        .collection('entities')
        .find({})
        .toArray();

      expect(entities).toMatchObject([
        { title: 'entity1', metadata: { text: [{ value: 'test' }] } },
        { title: 'entity2' },
        {
          title: 'entity3',
          published: true,
        },
      ]);
    });
  });
});
