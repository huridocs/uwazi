import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { TraversalQueryNode } from '#api/relationships.v2/model/TraversalQueryNode.js';
import { Property } from '#api/core/domain/template/Property.js';
import { RelationshipProperty } from '#api/core/domain/template/RelationshipProperty.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoTemplatesDataSource } from '../MongoTemplatesDataSource.js';
import { mapPropertyQuery } from '../QueryMapper.js';
import { MongoTemplateMapper } from '../MongoTemplateMapper.js';
import { SlotsReconciler } from '#api/core/infrastructure/elasticSearch/entities/SlotsReconciler.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';

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
        _id: factory.id('relationshipProp1'),
        name: 'relationshipProp1',
        type: 'newRelationship',
        label: 'relationshipProp1',
        query: createDBRelationshipQuery(1),
      },
    ]),
    factory.template('template2', [
      {
        _id: factory.id('relationshipProp2'),
        name: 'relationshipProp2',
        type: 'newRelationship',
        label: 'relationshipProp2',
        query: createDBRelationshipQuery(2),
      },
    ]),
    factory.template('template3', [
      {
        _id: factory.id('relationshipProp3'),
        name: 'relationshipProp3',
        type: 'newRelationship',
        label: 'relationshipProp3',
        query: createDBRelationshipQuery(3),
      },
    ]),
    factory.template('template4', [
      {
        _id: factory.id('textprop'),
        name: 'textprop',
        type: 'text',
        label: 'textProp',
      },
    ]),
  ],
};

beforeAll(async () => {
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

const createSut = () => {
  const db = getConnection();
  const transactionManager = TransactionManagerFactory.default();

  const slotsReconciler = TestUtils.mockClass<SlotsReconciler>({
    execute: jest.fn().mockResolvedValue(undefined),
  });
  const sut = new MongoTemplatesDataSource({
    db,
    slotsReconciler,
    transactionManager,
  });

  return { sut, slotsReconciler, transactionManager };
};

describe('getAllProperties()', () => {
  it('should return all the properties properly typed', async () => {
    const { sut } = createSut();

    const result = await sut.getAllProperties().all();

    expect(result.length).toBe(4);
    expect(result[0]).toBeInstanceOf(RelationshipProperty);
    expect(result[1]).toBeInstanceOf(RelationshipProperty);
    expect(result[2]).toBeInstanceOf(RelationshipProperty);
    expect(result[3]).toBeInstanceOf(Property);
    expect(result.map(p => ({ template: p.template.toString(), name: p.name }))).toMatchObject([
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
    const { sut } = createSut();

    const result = await sut.getAllRelationshipProperties().all();

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
    const { sut } = createSut();
    tds = sut;

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
    const { sut } = createSut();

    const result = await sut
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

describe('getByNames()', () => {
  it('should return the templates', async () => {
    const { sut } = createSut();

    const result = await sut.getByNames(['template1', 'template3']).all();

    expect(result).toMatchObject([
      {
        id: factory.id('template1').toString(),
        name: 'template1',
      },
      {
        id: factory.id('template3').toString(),
        name: 'template3',
      },
    ]);
  });
});

describe('getById()', () => {
  it('should return the template', async () => {
    const { sut } = createSut();

    const result = await sut.getById(factory.id('template1').toString());
    expect(result.getData()).toMatchObject({
      id: factory.id('template1').toString(),
      name: 'template1',
    });
  });
});

describe('slotsReconciler', () => {
  it('is called after create()', async () => {
    const { sut, slotsReconciler } = createSut();
    const template = factory.template('new_template', [factory.property('a_prop', 'text')]);
    await sut.create(MongoTemplateMapper.toDomain(template as any));
    expect(slotsReconciler.execute).toHaveBeenCalledTimes(1);
  });

  it('is called after update()', async () => {
    const { sut, slotsReconciler } = createSut();
    const existing = fixtures.templates[0];
    await sut.update(MongoTemplateMapper.toDomain(existing as any));
    expect(slotsReconciler.execute).toHaveBeenCalledTimes(1);
  });

  it('is called after delete()', async () => {
    const { sut, slotsReconciler } = createSut();
    await sut.delete(factory.id('template3').toHexString());
    expect(slotsReconciler.execute).toHaveBeenCalledTimes(1);
  });

  it('is called after bulkUpdate()', async () => {
    const { sut, slotsReconciler } = createSut();
    const templates = fixtures.templates.slice(0, 2).map(MongoTemplateMapper.toDomain as any);
    await sut.bulkUpdate(templates as any);
    expect(slotsReconciler.execute).toHaveBeenCalledTimes(1);
  });
});

describe('countByThesauri()', () => {
  const thesaurusId = factory.id('thesaurus_1').toHexString();
  const otherThesaurusId = factory.id('thesaurus_2').toHexString();

  beforeAll(async () => {
    const db = getConnection();
    await db.collection('templates').insertMany([
      {
        _id: factory.id('template_with_thesauri'),
        name: 'template_with_thesauri',
        properties: [
          {
            type: 'select',
            content: thesaurusId,
            name: 'country',
            label: 'Country',
          },
        ],
      },
      {
        _id: factory.id('template_with_other_thesauri'),
        name: 'template_with_other_thesauri',
        properties: [
          {
            type: 'select',
            content: otherThesaurusId,
            name: 'country',
            label: 'Country',
          },
        ],
      },
    ]);
  });

  it('should return templates count referencing the thesaurus', async () => {
    const { sut } = createSut();
    const count = await sut.countByThesauri(thesaurusId);
    expect(count).toBe(1);
  });

  it('should return 0 when no templates reference the thesaurus', async () => {
    const { sut } = createSut();
    const count = await sut.countByThesauri(new ObjectId().toHexString());
    expect(count).toBe(0);
  });
});
