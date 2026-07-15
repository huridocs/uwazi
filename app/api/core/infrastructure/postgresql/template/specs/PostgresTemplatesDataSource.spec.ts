import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { MongoTemplateMapper } from '#api/core/infrastructure/mongodb/template/MongoTemplateMapper.js';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';
import { LoggerFactory } from '#api/core/infrastructure/factories/LoggerFactory.js';
import { PostgresTemplatesDataSource } from '../PostgresTemplatesDataSource.js';
import { PostgresTemplatesDAO } from '../PostgresTemplatesDAO.js';
import { PostgresTransactionManager } from '../../common/PostgresTransactionManager.js';

const factory = getFixturesFactory();

describe('PostgresTemplatesDataSource', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const createDS = () => {
    const db = getConnection();
    const transactionManager = TransactionManagerFactory.default();
    const tenantId = tenants.current().name;
    const pgTransactionManager = new PostgresTransactionManager(
      PostgresDB.knex,
      tenantId,
      LoggerFactory.forTests()
    );
    const dao = new PostgresTemplatesDAO({
      tenantId,
      mongoDb: db,
      pgTransactionManager,
    });
    return new PostgresTemplatesDataSource({
      tenantId,
      mongoDb: db,
      transactionManager,
      pgTransactionManager,
      dao,
    });
  };

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

  it('should atomically increment completedJobs under concurrent calls', async () => {
    const ds = createDS();
    const template = factory.template('concurrent', [factory.property('text1', 'text')]);

    await testingPG.setFixtures({
      templates: [
        {
          _id: template._id.toHexString(),
          name: template.name,
          properties: template.properties,
          commonProperties: template.commonProperties,
          default: false,
          processing: { active: true, totalJobs: 10, completedJobs: 0 },
        },
      ],
    });

    // Fire 5 parallel increments
    const promises = Array.from({ length: 5 }, async () =>
      ds.incrementProcessingTracking(template._id.toHexString())
    );
    const results = await Promise.all(promises);

    // Final count must be exactly 5
    const finalRow = await ds.getById(template._id.toHexString());
    expect(finalRow.getData()!.processing!.completedJobs).toBe(5);

    // Each returned total should be 10
    results.forEach(r => expect(r.total).toBe(10));
  });

  it('should atomically add jobs to processing count under concurrent calls', async () => {
    const ds = createDS();
    const template = factory.template('concurrent-add', [factory.property('text1', 'text')]);

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

    // Fire 5 parallel calls adding 3 jobs each
    const promises = Array.from({ length: 5 }, async () =>
      ds.addJobsToProcessingCount(template._id.toHexString(), 3)
    );
    await Promise.all(promises);

    const finalRow = await ds.getById(template._id.toHexString());
    const processing = finalRow.getData()!.processing!;

    expect(processing.totalJobs).toBe(15); // 5 * 3
    expect(processing.active).toBe(true);
  });
});
