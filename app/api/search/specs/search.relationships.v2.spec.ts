import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { elastic } from '../elastic';
import { search } from '../search';
import { fixturesTimeOut } from './fixtures_elastic';

const fixturesFactory = getFixturesFactory();
const elasticIndex = 'index_for_index_testing';

beforeEach(async () => {
  await testingEnvironment.setUp(
    {
      templates: [
        fixturesFactory.template('template1', [
          fixturesFactory.property('relProp1', 'newRelationship', {
            denormalizedProperty: 'textProp1',
          }),
          fixturesFactory.property('relProp2', 'newRelationship', {
            denormalizedProperty: 'dateProp1',
          }),
        ]),
        fixturesFactory.template('template2', [fixturesFactory.property('textProp1', 'text', {})]),
        fixturesFactory.template('template3', [fixturesFactory.property('dateProp1', 'date', {})]),
      ],
      entities: [
        fixturesFactory.entity(
          'entity1',
          'template1',
          {
            relProp1: [
              {
                value: 'entity2',
                label: 'entity2-en',
                inheritedValue: [{ value: 'text_content' }],
                inheritedType: 'text',
              },
            ],
            relProp2: [
              {
                value: 'entity3',
                label: 'entity3-en',
                inheritedValue: [{ value: 1676688700080 }],
                inheritedType: 'date',
              },
            ],
          },
          { published: true }
        ),
        fixturesFactory.entity(
          'entity2',
          'template2',
          {
            textProp1: [fixturesFactory.metadataValue('text_content')],
          },
          { published: true }
        ),
        fixturesFactory.entity(
          'entity3',
          'template3',
          {
            dateProp1: [fixturesFactory.metadataValue(1676688700080)],
          },
          { published: true }
        ),
      ],
    },
    elasticIndex
  );
}, fixturesTimeOut);

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('mapping', () => {
  it('should map the property as if it was of the type of the denormalized property', async () => {
    const mapping = await elastic.indices.getMapping();
    const mappedProps = mapping.body[elasticIndex].mappings.properties.metadata.properties;

    expect(mappedProps.relProp1).toEqual(mappedProps.textProp1);
    expect(mappedProps.relProp2).toEqual(mappedProps.dateProp1);
  });
});

describe('indexing', () => {
  it('should index the relationship metadata property using as contents the denormalized values', async () => {
    const body = await elastic.search({});
    const entityWithRelationships = body.body.hits.hits.find(
      e => e._source.sharedId === 'entity1'
    )!._source;

    expect(entityWithRelationships.metadata!.relProp1).toEqual([{ value: 'text_content' }]);
    expect(entityWithRelationships.metadata!.relProp2).toEqual([{ value: 1676688700080 }]);
  });
});

describe('searching', () => {
  it('should filter the relationship metadata as the type of the denormalized values', async () => {
    let results = await search.search({ filters: { relProp2: { from: 1676688700080 } } }, 'en');
    expect(results.rows).toEqual([expect.objectContaining({ sharedId: 'entity1' })]);

    results = await search.search({ filters: { relProp1: 'text_content' } }, 'en');
    expect(results.rows).toEqual([expect.objectContaining({ sharedId: 'entity1' })]);
  });
});
