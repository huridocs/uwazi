import db from 'api/utils/testing_db';
import { instanceSearch } from 'api/search/search';
import instanceElasticTesting from 'api/utils/elastic_testing';

import inheritanceFixtures, { ids } from './fixturesInheritance';
import { fixturesTimeOut } from './fixtures_elastic';

describe('search.searchGeolocations', () => {
  const user = { _id: 'u1' };

  const elasticIndex = 'search.geolocation_index_test';
  const search = instanceSearch(elasticIndex);
  const elasticTesting = instanceElasticTesting(elasticIndex, search);

  beforeAll(async () => {
    await db.clearAllAndLoad(inheritanceFixtures);
    await elasticTesting.reindex();
  }, fixturesTimeOut);

  afterAll(async () => {
    await db.disconnect();
  });

  const cleanResults = results =>
    results.rows.reduce((_memo, row) => {
      const memo = _memo;
      const { sharedId, metadata } = row;
      memo.push({ sharedId, metadata });
      return memo;
    }, []);

  it('should include all geolocation finds, inheriting metadata', async () => {
    const results = await search.searchGeolocations({ order: 'asc', sort: 'sharedId' }, 'en', user);
    expect(cleanResults(results)).toMatchSnapshot();
  });

  it('should allow filtering as in normal search', async () => {
    const results = await search.searchGeolocations(
      { types: [ids.template3], order: 'asc', sort: 'sharedId' },
      'en',
      user
    );
    expect(cleanResults(results)).toMatchSnapshot();
  });

  it('should not fetch unpublished inherited metadata if request is not authenticated', async () => {
    const results = await search.searchGeolocations(
      { types: [ids.template3], order: 'asc', sort: 'sharedId' },
      'en'
    );

    const cleaned = cleanResults(results);
    const entity = cleaned.find(e => e.sharedId === 'entity_isLinkedToPrivateEntity');
    expect(entity).toBeFalsy();
    expect(results.rows.length).toBe(2);
    expect(results.totalRows).toBe(2);
  });

  it('should return empty results if there are no templates with geolocation fields', async () => {
    const tplWithoutGeolocation = inheritanceFixtures.templates.find(t => t._id === ids.template5);
    await db.mongodb.collection('templates').drop();
    await db.mongodb.collection('templates').insertOne(tplWithoutGeolocation);
    const results = await search.searchGeolocations({ order: 'asc', sort: 'sharedId' }, 'en', user);
    expect(results.rows.length).toBe(0);
    expect(results.totalRows).toBe(0);
  });
});
