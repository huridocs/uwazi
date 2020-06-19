import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';

import { instanceSearch } from '../search';
import { fixtures as fixturesForIndexErrors } from './fixtures_elastic_errors';

const forceIndexingOfNumberBasedProperty = async search => {
  await search.indexEntities({ title: 'Entity with index Problems 1' }, '', 1);
};

describe('entitiesIndex', () => {
  const elasticIndex = 'index_for_entities_index_testing';
  const search = instanceSearch(elasticIndex);
  const elasticTesting = instanceElasticTesting(elasticIndex, search);

  beforeEach(async () => {
    await db.clearAllAndLoad({});
    await elasticTesting.resetIndex();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('indexEntities', () => {
    beforeEach(async () => {
      await db.clearAllAndLoad(fixturesForIndexErrors);
      await elasticTesting.resetIndex();
      await forceIndexingOfNumberBasedProperty(search);
      await elasticTesting.refresh();
    });

    it('should attempt to index and throw on error', async () => {
      try {
        await search.indexEntities({}, '', 3);
        fail('Should not pass');
      } catch (err) {
        expect(err.toString()).toContain('ERROR Failed to index documents');
      }
    });

    it('should index all possible entities in bulk batches if option passed', async () => {
      const results = await search.indexEntities({}, '', 3, undefined, {
        continueOnIndexError: true,
      });

      expect(results.errors.length).toBe(3);

      await elasticTesting.refresh();
      const indexedEntities = await search.search({}, 'en');

      expect(indexedEntities.rows.length).toBe(4);
    });
  });
});
