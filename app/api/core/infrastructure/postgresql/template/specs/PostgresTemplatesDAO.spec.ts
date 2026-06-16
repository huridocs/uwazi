import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PostgresTemplatesDAO } from '../PostgresTemplatesDAO.js';

const factory = getFixturesFactory();

describe('PostgresTemplatesDAO', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const createDao = () =>
    new PostgresTemplatesDAO({
      connection: PostgresConnectionFactory.connectionConfig(),
      tenantId: tenants.current().name,
      mongoDb: getConnection(),
    });

  beforeEach(async () => {
    await testingPG.clear(['templates']);
  });

  it('should insert and retrieve templates', async () => {
    const dao = createDao();

    const template1 = factory.template('template1', [factory.property('text1', 'text')]);
    const template2 = factory.template('template2', [factory.property('date1', 'date')]);

    await testingPG.setFixtures({
      templates: [
        {
          _id: template1._id.toHexString(),
          name: template1.name,
          properties: template1.properties,
          commonProperties: template1.commonProperties,
          default: false,
        },
        {
          _id: template2._id.toHexString(),
          name: template2.name,
          properties: template2.properties,
          commonProperties: template2.commonProperties,
          default: false,
        },
      ],
    });

    const all = await dao.get();
    expect(all).toHaveLength(2);

    const byIds = await dao.get([template1._id.toHexString()]);
    expect(byIds).toHaveLength(1);
    expect(byIds[0].name).toBe('template1');
  });

  it('should find templates by content', async () => {
    const dao = createDao();
    const thesaurusId = factory.idString('thesaurus');

    const template = factory.template('withSelect', [
      { ...factory.property('select1', 'select'), content: thesaurusId },
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

    const found = await dao.getByContent(thesaurusId);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('withSelect');
  });

  it('should find default template', async () => {
    const dao = createDao();
    const defaultTemplate = factory.template('default', [], { default: true });
    const other = factory.template('other', []);

    await testingPG.setFixtures({
      templates: [
        {
          _id: defaultTemplate._id.toHexString(),
          name: defaultTemplate.name,
          properties: defaultTemplate.properties,
          commonProperties: defaultTemplate.commonProperties,
          default: true,
        },
        {
          _id: other._id.toHexString(),
          name: other.name,
          properties: other.properties,
          commonProperties: other.commonProperties,
          default: false,
        },
      ],
    });

    const result = await dao.getDefaultTemplate();
    expect(result?.name).toBe('default');
  });

  it('should count templates by thesaurus', async () => {
    const dao = createDao();
    const thesaurusId = factory.idString('thesaurus');

    const template = factory.template('withSelect', [
      { ...factory.property('select1', 'select'), content: thesaurusId },
    ]);
    const other = factory.template('other', []);

    await testingPG.setFixtures({
      templates: [
        {
          _id: template._id.toHexString(),
          name: template.name,
          properties: template.properties,
          commonProperties: template.commonProperties,
          default: false,
        },
        {
          _id: other._id.toHexString(),
          name: other.name,
          properties: other.properties,
          commonProperties: other.commonProperties,
          default: false,
        },
      ],
    });

    expect(await dao.countByThesauri(thesaurusId)).toBe(1);
    expect(await dao.countByThesauri(factory.idString('unused'))).toBe(0);
  });

  it('should find templates using a relation type', async () => {
    const dao = createDao();
    const relationTypeId = factory.idString('relationType');

    const template = factory.template('withRelationship', [
      { ...factory.property('rel1', 'relationship'), relationType: relationTypeId },
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

    const found = await dao.findUsingRelationTypeInProp(relationTypeId);
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('withRelationship');
  });
});
