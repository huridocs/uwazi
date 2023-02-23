import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { elastic } from '../elastic';
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
        fixturesFactory.entity('entity1', 'template1', {
          relProp1: [
            {
              value: 'entity2',
              label: 'entity2-es',
              inheritedValue: [{ value: 'text content' }],
              inheritedType: 'text',
            },
          ],
          relProp2: [
            {
              value: 'entity3',
              label: 'entity3-es',
              inheritedValue: [{ value: 1676688700080 }],
              inheritedType: 'date',
            },
          ],
        }),
        fixturesFactory.entity('entity2', 'template2', {
          textProp1: [fixturesFactory.metadataValue('text content')],
        }),
        fixturesFactory.entity('entity3', 'template3', {
          dateProp1: [fixturesFactory.metadataValue(1676688700080)],
        }),
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
  it('should index the relationshp metadata property using as contents the denormalized values', async () => {
    const body = await elastic.search({});
    const entityWithRelationships = body.body.hits.hits.find(
      e => e._source.sharedId === 'entity1'
    )!._source;

    expect(entityWithRelationships.metadata!.relProp1).toEqual([{ value: 'text content' }]);
    expect(entityWithRelationships.metadata!.relProp2).toEqual([{ value: 1676688700080 }]);
  });
});
