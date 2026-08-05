import { ObjectId } from 'mongodb';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { Property } from '#api/core/domain/template/Property.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { MongoTemplatesDataSource } from '../MongoTemplatesDataSource.js';

const factory = getFixturesFactory();

const fixtures = {
  templates: [
    factory.template('template1', [
      {
        _id: factory.id('relationshipProp1'),
        name: 'relationshipProp1',
        type: 'relationship',
        label: 'relationshipProp1',
        relationType: factory.id('rel1').toString(),
      },
    ]),
    factory.template('template2', [
      {
        _id: factory.id('relationshipProp2'),
        name: 'relationshipProp2',
        type: 'relationship',
        label: 'relationshipProp2',
        relationType: factory.id('rel1').toString(),
      },
    ]),
    factory.template('template3', [
      {
        _id: factory.id('relationshipProp3'),
        name: 'relationshipProp3',
        type: 'relationship',
        label: 'relationshipProp3',
        relationType: factory.id('rel1').toString(),
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

import { MongoTemplatesDAO } from '../MongoTemplatesDAO.js';

const createSut = () => {
  const db = getConnection();
  const transactionManager = TransactionManagerFactory.default();
  const dao = new MongoTemplatesDAO({ db, transactionManager });
  const sut = new MongoTemplatesDataSource({
    db,
    transactionManager,
    dao,
  });

  return { sut, transactionManager };
};

describe('getAllProperties()', () => {
  it('should return all the properties properly typed', async () => {
    const { sut } = createSut();

    const result = await sut.getAllProperties();

    expect(result.length).toBe(4);
    expect(result[0]).toBeInstanceOf(V1RelationshipProperty);
    expect(result[1]).toBeInstanceOf(V1RelationshipProperty);
    expect(result[2]).toBeInstanceOf(V1RelationshipProperty);
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

describe('when requesting a property by name', () => {
  let tds: MongoTemplatesDataSource;
  const props: { [name: string]: Property } = {};

  beforeAll(async () => {
    const { sut } = createSut();
    tds = sut;

    props.relationship = await tds.getPropertyByName('relationshipProp2');
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
      type: 'relationship',
      expectedClass: V1RelationshipProperty,
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
});

describe('getByIds()', () => {
  it('should return the templates', async () => {
    const { sut } = createSut();

    const result = await sut.getByIds([
      factory.id('template1').toString(),
      factory.id('template2').toString(),
    ]);
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

    const result = await sut.getByNames(['template1', 'template3']);

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
