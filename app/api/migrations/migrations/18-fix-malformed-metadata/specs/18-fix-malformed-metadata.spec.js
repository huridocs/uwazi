import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { thesauri1, thesauri2, entity1, entity2, entity3, entity4 } from './fixtures.js';

describe('migration fix-malformed-metadata', () => {
  beforeEach(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation(() => {});
    await testingDB.setupFixturesAndContext(fixtures);
    await migration.up(testingDB.mongodb);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  const getDocumentsFrom = async collection =>
    testingDB.mongodb.collection(collection).find().toArray();

  it('should have a delta number', () => {
    expect(migration.delta).toBe(18);
  });

  describe('thesauri', () => {
    it('should sanitize all thesauri values to be strings', async () => {
      const thesauri = await getDocumentsFrom('dictionaries');

      const countriesThesaurus = thesauri.find(t => t._id.toString() === thesauri1.toString());
      const issuesThesaurus = thesauri.find(t => t._id.toString() === thesauri2.toString());

      expect(countriesThesaurus.values.map(v => v.id)).toEqual(['123-c1', '4', '5']);
      expect(issuesThesaurus.values.map(v => v.id)).toEqual(['6', 'group']);
      expect(issuesThesaurus.values[1].values.map(v => v.id)).toEqual(['7', '345-i1']);
    });
  });

  describe('entities', () => {
    let entity1Data;
    let entity2Data;
    let entity3Data;
    let entity4Data;

    beforeEach(async () => {
      const entities = await getDocumentsFrom('entities');

      entity1Data = entities.find(t => t._id.toString() === entity1.toString());
      entity2Data = entities.find(t => t._id.toString() === entity2.toString());
      entity3Data = entities.find(t => t._id.toString() === entity3.toString());
      entity4Data = entities.find(t => t._id.toString() === entity4.toString());
    });

    const getEntitySelectProperty = (entity, property) =>
      Object.keys(entity.metadata).reduce((data, key) => {
        if (['country', 'issues'].includes(key)) {
          return entity.metadata[key].length
            ? data.concat(entity.metadata[key].map(v => v[property]))
            : data;
        }
        return data;
      }, []);

    const getSelectResults = entityData => ({
      selectValues: getEntitySelectProperty(entityData, 'value'),
      selectLabels: getEntitySelectProperty(entityData, 'label'),
    });

    const expectValuesLabels = (entity, values, labels) => {
      expect(entity.selectValues).toEqual(values);
      expect(entity.selectLabels).toEqual(labels);
    };

    it('should preserve existing metadata', async () => {
      expect(entity1Data.metadata.free_text[0].value).toBe('some text');
      expect(entity4Data.metadata.free_text[0].value).toBe('some French text');
    });

    it('should sanitize select and multiselect values to be strings, populate missing labels and delete pointers to non-existing IDs', async () => {
      const e1 = getSelectResults(entity1Data);
      const e2 = getSelectResults(entity2Data);
      const e3 = getSelectResults(entity3Data);
      const e4 = getSelectResults(entity4Data);

      expectValuesLabels(e1, ['123-c1', '6', '7'], ['Country1_en', 'Murder_en', 'Kidnapping_en']);
      expectValuesLabels(
        e2,
        ['4', '7', '6', '345-i1'],
        ['Country2_es', 'Kidnapping_es', 'Murder_es', 'Violence_es']
      );
      expectValuesLabels(e3, [], []);
      expect(entity3Data.metadata.issues).toEqual([]);
      expectValuesLabels(e4, ['4'], ['Country2']);
    });
  });
});
