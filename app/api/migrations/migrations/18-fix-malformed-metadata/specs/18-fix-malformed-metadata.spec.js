/** @format */

import testingDB from 'api/utils/testing_db';
import migration from '../index.js';
import fixtures, { thesauri1, thesauri2 } from './fixtures.js';

describe('migration fix-malformed-metadata', () => {
  beforeEach(async () => {
    // spyOn(process.stdout, 'write');
    await testingDB.clearAllAndLoad(fixtures);
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

  it('should sanitize all thesauri values to be strings', async () => {
    await migration.up(testingDB.mongodb);
    const thesauri = await getDocumentsFrom('dictionaries');

    const countriesThesaurus = thesauri.find(t => t._id.toString() === thesauri1.toString());
    const issuesThesaurus = thesauri.find(t => t._id.toString() === thesauri2.toString());

    expect(countriesThesaurus.values.map(v => v.id)).toMatchSnapshot();
    expect(issuesThesaurus.values.map(v => v.id)).toMatchSnapshot();
    expect(issuesThesaurus.values[1].values.map(v => v.id)).toMatchSnapshot();
  });
});
