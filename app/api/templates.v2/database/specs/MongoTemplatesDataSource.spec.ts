import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MatchQueryNode } from 'api/relationships.v2/database/graphs/MatchQueryNode';
import { MongoGraphQueryParser } from 'api/relationships.v2/database/MongoGraphQueryParser';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoTemplatesDataSource } from '../MongoTemplatesDataSource';

const parser = new MongoGraphQueryParser();

const factory = getFixturesFactory();

const createDBRelationshipQuery = (index: number) => ({
  traverse: [
    {
      types: [factory.id(`type${index}`).toHexString()],
      direction: 'out' as const,
      match: [
        {
          templates: [factory.id(`template${index}`).toHexString()],
        },
      ],
    },
  ],
});

const createRelationshipQuery = (index: number) => parser.parse(createDBRelationshipQuery(index));

const fixtures = {
  templates: [
    factory.template('template1', [
      {
        name: 'relationshipProp1',
        type: 'newRelationship',
        label: 'relationshipProp1',
        query: createDBRelationshipQuery(1),
      },
    ]),
    factory.template('template2', [
      {
        name: 'relationshipProp2',
        type: 'newRelationship',
        label: 'relationshipProp2',
        query: createDBRelationshipQuery(2),
      },
    ]),
    factory.template('template3', [
      {
        name: 'relationshipProp3',
        type: 'newRelationship',
        label: 'relationshipProp3',
        query: createDBRelationshipQuery(3),
      },
    ]),
  ],
};

beforeEach(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('when requesting the relationship properties configured in the system', () => {
  it('should return all the relationship properties', async () => {
    const dataSource = new MongoTemplatesDataSource(getConnection());
    const result = await dataSource.getAllRelationshipProperties().all();
    expect(result.length).toBe(3);
    result.forEach(prop => {
      expect(prop).toBeInstanceOf(RelationshipProperty);
      expect(prop.query).toBeInstanceOf(MatchQueryNode);
    });
    expect(result).toEqual([
      expect.objectContaining({ name: 'relationshipProp1', query: createRelationshipQuery(1) }),
      expect.objectContaining({ name: 'relationshipProp2', query: createRelationshipQuery(2) }),
      expect.objectContaining({ name: 'relationshipProp3', query: createRelationshipQuery(3) }),
    ]);
  });
});
