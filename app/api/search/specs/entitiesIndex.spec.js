import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';
import errorLog from 'api/log/errorLog';

import { instanceSearch } from '../search';
import { fixtures as fixturesForIndexErrors } from './fixtures_elastic_errors';
import elastic from '../elastic';

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
    const expectParsingException = () =>
      expect.objectContaining({
        index: expect.objectContaining({
          error: expect.objectContaining({ type: 'mapper_parsing_exception' }),
        }),
      });

    const loadFailingFixtures = async () => {
      await db.clearAllAndLoad(fixturesForIndexErrors);
      await elasticTesting.resetIndex();
      await forceIndexingOfNumberBasedProperty(search);
      await elasticTesting.refresh();
    };

    it('indexing without errors', async () => {
      spyOn(errorLog, 'error').and.returnValue('Ok');
      await loadFailingFixtures();
      await search.indexEntities({ title: 'Entity with index Problems 1' }, '', 1);
      expect(errorLog.error).not.toHaveBeenCalled();
      await elasticTesting.refresh();
      const indexedEntities = await search.search({}, 'en');
      expect(indexedEntities.rows.length).toBe(1);
    });

    it('should handle 1 error', async () => {
      spyOn(errorLog, 'error').and.returnValue('Ok');
      await loadFailingFixtures();
      try {
        await search.indexEntities({ title: 'Entity with index Problems 2' }, '', 1);
        fail('should have thown errors');
      } catch (err) {
        expect(err.toString()).toContain('Failed to index documents');
        expect(err.errors).toEqual([expectParsingException()]);
      }
      expect(errorLog.error).toHaveBeenCalledTimes(1);
      await elasticTesting.refresh();
      const indexedEntities = await search.search({}, 'en');
      expect(indexedEntities.rows.length).toBe(1);
    });

    /*eslint max-statements: ["error", 20]*/
    it('should index all possible entities in bulk batches and throw errors at the end', async () => {
      spyOn(errorLog, 'error').and.returnValue('Ok');
      await loadFailingFixtures();
      try {
        await search.indexEntities({});
        fail('should have thown errors');
      } catch (err) {
        expect(err.toString()).toContain('Failed to index documents');
        expect(err.errors).toEqual([
          expectParsingException(),
          expectParsingException(),
          expectParsingException(),
        ]);
      }
      expect(errorLog.error).toHaveBeenCalledTimes(1);
      await elasticTesting.refresh();
      const indexedEntities = await search.search({}, 'en');
      expect(indexedEntities.rows.length).toBe(4);
    });

    /*eslint max-statements: ["error", 20]*/
    /*eslint-disable*/
    // it('should stop if the error is not controlled (ie. if it is not an indexing error)', async () => {
    //   await loadFailingFixtures();
    //
    //   spyOn(errorLog, 'error').and.returnValue('Ok');
    //   const a_mock = jest.spyOn(elastic, 'bulk');
    //   a_mock.mockImplementationOnce( () => {throw new Error('not a mapping exception')} );
    //
    //   try {
    //     await search.indexEntities({}, '', 3);
    //     fail('should have thown errors');
    //   } catch (err) {
    //     // console.log(err.errors.toString(), "err")
    //     expect(err.errors.toString()).toContain('not a mapping exception');
    //   }
    //   expect(errorLog.error).toHaveBeenCalledTimes(1);
    //   await elasticTesting.refresh();
    //   const indexedEntities = await search.search({}, 'en');
    //   expect(indexedEntities.rows.length).toBe(1);
    // });
  });
});
