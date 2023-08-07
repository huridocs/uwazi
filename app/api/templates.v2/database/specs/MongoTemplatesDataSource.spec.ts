import { getClient, getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { TraversalQueryNode } from 'api/relationships.v2/model/TraversalQueryNode';
import { Property } from 'api/templates.v2/model/Property';
import { RelationshipProperty } from 'api/templates.v2/model/RelationshipProperty';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { MongoTemplatesDataSource } from '../MongoTemplatesDataSource';
import { mapPropertyQuery } from '../QueryMapper';

const factory = getFixturesFactory();

const createDBRelationshipQuery = (index: number) => [
  {
    types: [factory.id(`type${index}`)],
    direction: 'out' as const,
    match: [
      {
        templates: [factory.id(`template${index}`)],
      },
    ],
  },
];

const createRelationshipQuery = (index: number) =>
  mapPropertyQuery(createDBRelationshipQuery(index));

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
    factory.template('template4', [
      {
        name: 'textprop',
        type: 'text',
        label: 'textProp',
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

describe('getAllProperties()', () => {
  it('should return all the properties properly typed', async () => {
    const dataSource = new MongoTemplatesDataSource(
      getConnection(),
      new MongoTransactionManager(getClient())
    );
    const result = await dataSource.getAllProperties().all();
    expect(result.length).toBe(4);
    expect(result[0]).toBeInstanceOf(RelationshipProperty);
    expect(result[1]).toBeInstanceOf(RelationshipProperty);
    expect(result[2]).toBeInstanceOf(RelationshipProperty);
    expect(result[3]).toBeInstanceOf(Property);
    expect(result).toMatchObject([
      {
        name: 'relationshipProp1',
        template: factory.id('template1').toHexString(),
      },
      {
        name: 'relationshipProp2',
        template: factory.id('template2').toHexString(),
      },
      {
        name: 'relationshipProp3',
        template: factory.id('template3').toHexString(),
      },
      {
        name: 'textprop',
        template: factory.id('template4').toHexString(),
      },
    ]);
  });
});

describe('when requesting the relationship properties configured in the system', () => {
  it('should return all the relationship properties', async () => {
    const dataSource = new MongoTemplatesDataSource(
      getConnection(),
      new MongoTransactionManager(getClient())
    );
    const result = await dataSource.getAllRelationshipProperties().all();
    expect(result.length).toBe(3);
    result.forEach(property => {
      expect(property).toBeInstanceOf(RelationshipProperty);
      expect(property.query[0]).toBeInstanceOf(TraversalQueryNode);
    });
    expect(result).toMatchObject([
      {
        name: 'relationshipProp1',
        query: createRelationshipQuery(1),
        template: factory.id('template1').toHexString(),
      },
      {
        name: 'relationshipProp2',
        query: createRelationshipQuery(2),
        template: factory.id('template2').toHexString(),
      },
      {
        name: 'relationshipProp3',
        query: createRelationshipQuery(3),
        template: factory.id('template3').toHexString(),
      },
    ]);
  });
});

describe('when requesting a property by name', () => {
  let tds: MongoTemplatesDataSource;
  const props: { [name: string]: Property } = {};

  beforeAll(async () => {
    tds = new MongoTemplatesDataSource(getConnection(), new MongoTransactionManager(getClient()));
    props.newRelationship = await tds.getPropertyByName('relationshipProp2');
    props.text = await tds.getPropertyByName('textprop');
  });

  it.each([
    {
      name: 'textprop',
      type: 'text',
      expectedClass: Property,
    },
    {
      name: 'relationshipProp2',
      type: 'newRelationship',
      expectedClass: RelationshipProperty,
    },
  ])(
    'should return one matching property properly typed: $type',
    ({ name, type, expectedClass }) => {
      const prop = props[type];
      expect(prop).toBeInstanceOf(expectedClass);
      expect(prop.name).toEqual(name);
      expect(prop.type).toEqual(type);
    }
  );

  it('should cache the map', () => {
    // eslint-disable-next-line dot-notation
    expect(tds['_nameToPropertyMap']).not.toBeUndefined();
  });
});

describe('getByIds()', () => {
  it('should return the templates', async () => {
    const dataSource = new MongoTemplatesDataSource(
      getConnection(),
      new MongoTransactionManager(getClient())
    );
    const result = await dataSource
      .getByIds([factory.id('template1').toString(), factory.id('template2').toString()])
      .all();
    expect(result).toMatchObject([
      {
        id: factory.id('template1').toString(),
        name: 'template1',
      },
      {
        id: factory.id('template2').toString(),
        name: 'template2',
      },
    ]);
  });
});

describe('getById()', () => {
  it('should return the template', async () => {
    const dataSource = new MongoTemplatesDataSource(
      getConnection(),
      new MongoTransactionManager(getClient())
    );
    const result = await dataSource.getById(factory.id('template1').toString());
    expect(result).toMatchObject({
      id: factory.id('template1').toString(),
      name: 'template1',
    });
  });
});
