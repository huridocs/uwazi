/** @format */

import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { thesauri1, thesauri2, entity1, entity2, entity3 } from './fixtures.js';

describe('migration fix-malformed-metadata', () => {
  beforeEach(async () => {
    // spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
    await migration.up(testingDB.mongodb);
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  const getDocumentsFrom = async collection =>
    testingDB.mongodb
      .collection(collection)
      .find()
      .toArray();

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

    beforeEach(async () => {
      const entities = await getDocumentsFrom('entities');

      entity1Data = entities.find(t => t._id.toString() === entity1.toString());
      entity2Data = entities.find(t => t._id.toString() === entity2.toString());
      entity3Data = entities.find(t => t._id.toString() === entity3.toString());
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

    it('should sanitize all metadata values to be strings, populate missing labels and delete pointers to non-existing IDs', async () => {
      const e1 = {
        selectValues: getEntitySelectProperty(entity1Data, 'value'),
        selectLabels: getEntitySelectProperty(entity1Data, 'label'),
      };
      const e2 = {
        selectValues: getEntitySelectProperty(entity2Data, 'value'),
        selectLabels: getEntitySelectProperty(entity2Data, 'label'),
      };
      const e3 = {
        selectValues: getEntitySelectProperty(entity3Data, 'value'),
        selectLabels: getEntitySelectProperty(entity3Data, 'label'),
      };

      expect(e1.selectValues).toEqual(['123-c1', '6', '7']);
      expect(e1.selectLabels).toEqual(['Country1_en', 'Murder_en', 'Kidnapping_en']);
      expect(e2.selectValues).toEqual(['4', '7', '6', '345-i1']);
      expect(e2.selectLabels).toEqual(['Country2_es', 'Kidnapping_es', 'Murder_es', 'Violence_es']);
      expect(e3.selectValues).toEqual([undefined]);
      expect(e3.selectLabels).toEqual([undefined]);
    });
  });
});
