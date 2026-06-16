import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { PostgresTemplatesDataSource } from '../PostgresTemplatesDataSource.js';

const factory = getFixturesFactory();

describe('PostgresTemplatesDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const createDS = () =>
    new PostgresTemplatesDataSource({
      connection: PostgresConnectionFactory.connectionConfig(),
      tenantId: tenants.current().name,
      mongoDb: getConnection(),
      transactionManager: TransactionManagerFactory.default(),
    });

  beforeEach(async () => {
    await testingPG.clear(['templates']);
  });

  it('should create and retrieve a template by id', async () => {
    const ds = createDS();
    const template = factory.template('test', [factory.property('text1', 'text')]);

    const domainTemplate = await ds.getById(template._id.toHexString());
    expect(domainTemplate.getData()).toBeUndefined();

    // Create via domain factory path would need a full Template object; here we seed PG directly
    await testingPG.setFixtures({
      templates: [
        {
          _id: template._id.toHexString(),
          name: template.name,
          properties: template.properties,
          commonProperties: template.commonProperties,
          default: false,
        },
      ],
    });

    const found = await ds.getById(template._id.toHexString());
    expect(found.getData()?.name).toBe('test');
  });

  it('should find templates referencing a given template id', async () => {
    const ds = createDS();
    const referencedId = factory.idString('referenced');

    const referencing = factory.template('referencing', [
      { ...factory.property('rel1', 'relationship'), content: referencedId },
    ]);
    const unrelated = factory.template('unrelated', [factory.property('text1', 'text')]);

    await testingPG.setFixtures({
      templates: [
        {
          _id: referencing._id.toHexString(),
          name: referencing.name,
          properties: referencing.properties,
          commonProperties: referencing.commonProperties,
          default: false,
        },
        {
          _id: unrelated._id.toHexString(),
          name: unrelated.name,
          properties: unrelated.properties,
          commonProperties: unrelated.commonProperties,
          default: false,
        },
      ],
    });

    const found = await ds.findTemplatesReferencing(referencedId);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('referencing');
  });

  it('should get all relationship properties', async () => {
    const ds = createDS();

    const withNewRel = factory.template('newRel', [
      {
        ...factory.property('rel1', 'newRelationship'),
        query: [
          {
            direction: 'out',
            types: [factory.idString('type1')],
            match: [{ templates: [factory.idString('targetTemplate')] }],
          },
        ],
      },
    ]);

    await testingPG.setFixtures({
      templates: [
        {
          _id: withNewRel._id.toHexString(),
          name: withNewRel.name,
          properties: withNewRel.properties,
          commonProperties: withNewRel.commonProperties,
          default: false,
        },
      ],
    });

    const relProps = await ds.getAllRelationshipProperties();
    expect(relProps).toHaveLength(1);
    expect(relProps[0].name).toBe('rel1');
    expect(relProps[0].query).toHaveLength(1);
  });

  it('should get all text properties', async () => {
    const ds = createDS();

    const template = factory.template('texts', [
      factory.property('text1', 'text'),
      factory.property('markdown1', 'markdown'),
      factory.property('date1', 'date'),
    ]);

    await testingPG.setFixtures({
      templates: [
        {
          _id: template._id.toHexString(),
          name: template.name,
          properties: template.properties,
          commonProperties: template.commonProperties,
          default: false,
        },
      ],
    });

    const textProps = await ds.getAllTextProperties();
    expect(textProps).toHaveLength(3);
    expect(textProps.map(p => p.name).sort()).toEqual(['markdown1', 'text1', 'title']);
  });

  it('should check template uniqueness', async () => {
    const ds = createDS();

    const template = factory.template('unique', [factory.property('text1', 'text')]);

    await testingPG.setFixtures({
      templates: [
        {
          _id: template._id.toHexString(),
          name: template.name,
          properties: template.properties,
          commonProperties: template.commonProperties,
          default: false,
        },
      ],
    });

    const uniqueTemplate = MongoTemplateMapper.toDomain(
      factory.template('unique', [], { _id: factory.id('newId') }) as any
    );

    expect(await ds.isTemplateUnique(uniqueTemplate)).toBe(false);

    const uniqueTemplate2 = MongoTemplateMapper.toDomain(
      factory.template('differentCheck', [], { _id: factory.id('newId2') }) as any
    );

    expect(await ds.isTemplateUnique(uniqueTemplate2)).toBe(true);
  });
});
