import db from 'api/utils/testing_db';
import instanceElasticTesting from 'api/utils/elastic_testing';
import errorLog from 'api/log/errorLog';
import { instanceSearch } from '../search';
import { fixtures as fixturesForIndexErrors } from './fixtures_elastic_errors';
import elastic from '../elastic';
import { checkMapping, updateMapping, reindexAll } from '../entitiesIndex';

const forceIndexingOfNumberBasedProperty = async search => {
  await search.indexEntities({ title: 'Entity with index Problems 1' }, '', 1);
};

describe('entitiesIndex', () => {
  const elasticIndex = 'index_for_entities_index_testing';
  const search = instanceSearch(elasticIndex);
  const elasticTesting = instanceElasticTesting(elasticIndex, search);

  beforeEach(async () => {
    await db.clearAllAndLoad({
      entities: [
        {
          title: 'test',
          metadata: {},
        },
      ],
    });
    await elasticTesting.resetIndex();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  describe('indexEntities', () => {
    const loadFailingFixtures = async () => {
      await db.clearAllAndLoad(fixturesForIndexErrors);
      await elasticTesting.resetIndex();
      // force indexing will ensure that all exceptions are mapper_parsing. Otherwise you get different kinds of exceptions
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
  });

  describe('indexEntities by query', () => {
    const flatten = array => [].concat(...array);

    it('should only index the entities that match the query', async () => {
      await db.clearAllAndLoad({
        entities: [
          { title: 'title1', language: 'en' },
          { title: 'titulo1', language: 'es' },
          { title: 'title2', language: 'en' },
          { title: 'titulo2', language: 'es' },
          { title: 'title3', language: 'en' },
          { title: 'titulo3', language: 'es' },
          { title: 'title4', language: 'en' },
          { title: 'titulo4', language: 'es' },
          { title: 'title5', language: 'en' },
          { title: 'titulo5', language: 'es' },
        ],
      });
      await elasticTesting.reindex();
      spyOn(elastic, 'bulk').and.returnValue(Promise.resolve({ body: {} }));
      await search.indexEntities({ language: 'es' }, '', 2);

      const indexedEntities = flatten(flatten(elastic.bulk.calls.allArgs()).map(arg => arg.body))
        .filter(bulkElement => !bulkElement.index)
        .sort((a, b) => a.title.localeCompare(b.title));

      expect(indexedEntities).toEqual([
        expect.objectContaining({ title: 'titulo1' }),
        expect.objectContaining({ title: 'titulo2' }),
        expect.objectContaining({ title: 'titulo3' }),
        expect.objectContaining({ title: 'titulo4' }),
        expect.objectContaining({ title: 'titulo5' }),
      ]);
    });
  });

  describe('updateMapping', () => {
    it('should update the mapping provided by the factory', async () => {
      const templates = [
        {
          _id: '123',
          name: 'test',
          properties: [
            { name: 'name', type: 'text' },
            { name: 'dob', type: 'date' },
            { name: 'country', type: 'select' },
          ],
        },
      ];
      await updateMapping(templates, elasticIndex);
      const mapping = await elastic.indices.getMapping({ index: elasticIndex });
      const mappedProps = mapping.body[elasticIndex].mappings.properties.metadata.properties;
      expect(mappedProps.name).toMatchSnapshot();
      expect(mappedProps.dob).toMatchSnapshot();
      expect(mappedProps.country).toMatchSnapshot();
    });
  });

  describe('checkMapping', () => {
    it('should check mapping of a template vs current mapping', async () => {
      const templateA = {
        _id: '123',
        name: 'template A',
        properties: [
          { name: 'name', type: 'text', label: 'Name' },
          { name: 'dob', type: 'date', label: 'Date of birth' },
          { name: 'country', type: 'select', label: 'Country' },
        ],
      };

      const templateB = {
        _id: '456',
        name: 'template B',
        properties: [{ name: 'dob', type: 'date', label: 'Date of birth' }],
      };

      await updateMapping([templateA], elasticIndex);
      let response = await checkMapping(templateB, elasticIndex);
      expect(response).toEqual({ errors: [], valid: true });

      templateB.properties[0].type = 'text';
      response = await checkMapping(templateB, elasticIndex);
      expect(response).toEqual({ errors: [{ name: 'Date of birth' }], valid: false });
    });
  });

  describe('reindexAll', () => {
    it('should delete a field from the mapping', async () => {
      const templateA = {
        _id: '123',
        name: 'template A',
        properties: [
          { name: 'name', type: 'text' },
          { name: 'dob', type: 'date' },
          { name: 'country', type: 'select' },
        ],
      };

      await updateMapping([templateA], elasticIndex);
      templateA.properties = [
        { name: 'name', type: 'text' },
        { name: 'country', type: 'select' },
      ];
      await reindexAll([templateA], search, elasticIndex);
      const mapping = await elastic.indices.getMapping({ index: elasticIndex });

      expect(
        mapping.body[elasticIndex].mappings.properties.metadata.properties.dob
      ).toBeUndefined();
    });
  });
});
