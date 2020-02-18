import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures from './fixtures.js';

const unique = (v, i, a) => a.indexOf(v) === i;
const query = (collectionName, queryObject = {}, select = {}) =>
  testingDB.mongodb
    .collection(collectionName)
    .find(queryObject, select)
    .toArray();

describe('migration move_document_to_files', () => {
  beforeEach(async () => {
    spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
  });

  afterAll(async () => {
    testingDB.disconnect();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(21);
  });

  it('should remove all file related properties from entities', async () => {
    await migration.up(testingDB.mongodb);
    const entities = await query('entities');
    const propsOnEntities = entities
      .reduce((memo, e) => memo.concat(Object.keys(e)), [])
      .filter(unique);

    expect(propsOnEntities).toEqual(['_id', 'sharedId', 'title', 'language']);
  });

  it('should move all file related properties to a file mongodb document', async () => {
    await migration.up(testingDB.mongodb);
    const files = await query('files');

    expect(files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity: 'sharedId',
          filename: 'filename_spanish',
          type: 'document',
          processed: false,
          totalPages: 55,
          toc: [{ label: 'toc item spanish' }],
          fullText: { 1: 'page1 spanish' },
          pdfInfo: { 1: 15 },
        }),
        expect.objectContaining({
          entity: 'sharedId',
          filename: 'filename_english',
          type: 'document',
          processed: true,
          totalPages: 45,
          toc: [{ label: 'toc item english' }],
          fullText: { 1: 'page1 english' },
          pdfInfo: { 1: 10 },
        }),
      ])
    );
  });

  it('should not duplicate filename when file for each language is the same', async () => {
    await migration.up(testingDB.mongodb);
    const files = await query('files');

    expect(files.length).toBe(3);
    expect(files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entity: 'sharedId2',
          type: 'document',
          language: 'en',
        }),
      ])
    );
  });
});
