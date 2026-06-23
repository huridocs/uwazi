import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { PostgresConnectionFactory } from '#api/core/infrastructure/factories/PostgresConnectionFactory.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { PostgresTemplatesSyncHandler } from '../PostgresTemplatesSyncHandler.js';

const factory = getFixturesFactory();

describe('PostgresTemplatesSyncHandler', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const createHandler = () =>
    new PostgresTemplatesSyncHandler({
      connection: PostgresConnectionFactory.connectionConfig(),
      tenantId: tenants.current().name,
      mongoDb: getConnection(),
    });

  beforeEach(async () => {
    await testingPG.clear(['templates']);
  });

  it('should save a template', async () => {
    const handler = createHandler();

    const template = factory.template('syncTemplate', [factory.property('text1', 'text')]);
    await handler.save({
      _id: template._id.toHexString(),
      name: template.name,
      properties: template.properties,
      commonProperties: template.commonProperties,
      default: false,
    });

    const found = await handler.getById(template._id.toHexString());
    expect(found?.name).toBe('syncTemplate');
  });

  it('should save multiple templates', async () => {
    const handler = createHandler();

    const template1 = factory.template('sync1', []);
    const template2 = factory.template('sync2', []);

    await handler.saveMultiple([
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
    ]);

    const rows = await testingPG.getAllFrom('templates');
    expect(rows).toHaveLength(2);
  });

  it('should delete a template', async () => {
    const handler = createHandler();

    const template = factory.template('toDelete', []);
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

    await handler.delete(template._id.toHexString());

    const found = await handler.getById(template._id.toHexString());
    expect(found).toBeNull();
  });

  it('should unset other default when saving a default template', async () => {
    const handler = createHandler();

    const oldDefault = factory.template('oldDefault', [], { default: true });
    const newDefault = factory.template('newDefault', []);

    await handler.save({
      _id: oldDefault._id.toHexString(),
      name: oldDefault.name,
      properties: oldDefault.properties,
      commonProperties: oldDefault.commonProperties,
      default: true,
    });

    await handler.save({
      _id: newDefault._id.toHexString(),
      name: newDefault.name,
      properties: newDefault.properties,
      commonProperties: newDefault.commonProperties,
      default: true,
    });

    const rows = await testingPG.getAllFrom('templates');
    expect(rows.filter(r => r.default)).toHaveLength(1);
    expect(rows.find(r => r.default)?._id).toBe(newDefault._id.toHexString());
  });
});
