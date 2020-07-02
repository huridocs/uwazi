import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';
import errorLog from 'api/log/errorLog';

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
    // beforeEach(async () => {
    //   await db.clearAllAndLoad(fixturesForIndexErrors);
    //   await elasticTesting.resetIndex();
    //   await forceIndexingOfNumberBasedProperty(search);
    //   await elasticTesting.refresh();
    // });

    const expectParsingException = () =>
      expect.objectContaining({
        index: expect.objectContaining({
          error: expect.objectContaining({ type: 'mapper_parsing_exception' }),
        }),
      });

    it('should index all possible entities in bulk batches and throw errors at the end', async () => {
      spyOn(errorLog, 'error').and.returnValue('Ok');
      await db.clearAllAndLoad(fixturesForIndexErrors);
      await elasticTesting.resetIndex();
      await forceIndexingOfNumberBasedProperty(search);
      await elasticTesting.forcemerge();
      await elasticTesting.refresh();
      try {
        await elasticTesting.reindex();
        fail('should have thown errors');
      } catch (err) {
        expect(err.toString()).toContain('Failed to index documents');
        // console.log("indexed errors", err);
        // console.log("len", err.errors.length);
        // for(let i= 0; i < err.errors.length; i += 1) {
        //   console.log(err.errors[i]);
        // }
      }
      expect(errorLog.error).toHaveBeenCalledTimes(1);
      // await elasticTesting.refresh();
      // const indexedEntities = await search.search({}, 'en');
      // expect(indexedEntities.rows.length).toBe(4);

      // spyOn(errorLog, 'error').and.returnValue('Ok');
      // try {
      //   await search.indexEntities({}, '', 3);
      //   fail('should have thown an error');
      // } catch (err) {
      //   // expect(errorLog.error()).toHAveBeenCalled();
      //   // console.log("the error is", err);
      //   expect(true).toBe(true);
      // }
      // } catch (err) {
      //   expect(err.toString()).toContain('Failed to index documents');
      //   expect(err.errors).toEqual([
      //     expectParsingException(),
      //     expectParsingException(),
      //     expectParsingException(),
      //   ]);
      //
      //   await elasticTesting.refresh();
      //   const indexedEntities = await search.search({}, 'en');
      //   expect(indexedEntities.rows.length).toBe(4);
      // }
    });
  });
});
