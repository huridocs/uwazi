import { EntityDBO } from '#api/core/infrastructure/mongodb/entity/EntityDBO.js';
import { UpdateEntityRequest } from '#api/core/infrastructure/express/entity/Schemas.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RequestEntityTranslation } from '../../RequestEntityTranslation.js';
import { SaveEntityTranslations } from '../../SaveEntityTranslations.js';
import { ATConflictSolver } from '../ATConflictSolver.js';
import { createMockLogger } from '#api/core/libs/logger/infrastructure/MockLogger.js';

const factory = getFixturesFactory();

describe('ATConflictSolver', () => {
  let resolver: ATConflictSolver;
  let mockLogger: ReturnType<typeof createMockLogger>;

  beforeEach(async () => {
    const fixtures = {
      settings: [
        {
          features: {
            automaticTranslation: {
              active: true,
              templates: [
                {
                  template: factory.idString('template'),
                  properties: [factory.idString('prop1'), factory.idString('prop2')],
                  commonProperties: [factory.commonPropertiesTitleId('template')],
                },
              ],
            },
          },
        },
      ],
      templates: [
        factory.template('template', [factory.property('prop1'), factory.property('prop2')]),
      ],
    };
    await testingEnvironment.setUp(fixtures);

    const { AutomaticTranslationFactory } = await import('../../AutomaticTranslationFactory.js');
    const { TransactionManagerFactory } =
      await import('#api/core/infrastructure/factories/TransactionManagerFactory.js');

    mockLogger = createMockLogger();
    resolver = new ATConflictSolver(
      AutomaticTranslationFactory.defaultATConfigDataSource(TransactionManagerFactory.default()),
      mockLogger
    );
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  const buildCurrentEntity = (overrides: Partial<EntityDBO> = {}) =>
    ({
      _id: factory.id('entity'),
      sharedId: 'entity',
      language: 'en',
      template: factory.id('template'),
      title: 'current entity',
      metadata: { prop1: [{ value: 'old text' }], prop2: [{ value: 'old text' }] },
      obsoleteMetadata: [],
      creationDate: Date.now(),
      editDate: Date.now(),
      published: false,
      ...overrides,
    }) as EntityDBO;

  const buildUpdatedEntity = (overrides: Partial<UpdateEntityRequest> = {}) =>
    ({
      _id: factory.idString('entity'),
      sharedId: 'entity',
      language: 'en',
      template: factory.idString('template'),
      title: 'new entity',
      metadata: { prop1: [{ value: 'new text' }], prop2: [{ value: 'new text' }] },
      ...overrides,
    }) as UpdateEntityRequest;

  it('should return updatedEntity unchanged when AT is inactive', async () => {
    const fixtures = {
      settings: [{ features: { automaticTranslation: { active: false } } }],
      templates: [factory.template('template', [factory.property('prop1')])],
    };
    await testingEnvironment.setUp(fixtures);

    const current = buildCurrentEntity();
    const updated = buildUpdatedEntity();
    const result = await resolver.execute(current, updated);

    expect(result.title).toBe('new entity');
  });

  it('should return updatedEntity unchanged when there is no AT config for the template', async () => {
    const current = buildCurrentEntity({ template: factory.id('other_template') });
    const updated = buildUpdatedEntity({ template: factory.idString('other_template') });
    const result = await resolver.execute(current, updated);

    expect(result.title).toBe('new entity');
  });

  it('should return updatedEntity unchanged when values do not conflict', async () => {
    const current = buildCurrentEntity({
      title: 'regular title',
      metadata: { prop1: [{ value: 'regular value' }] },
    });
    const updated = buildUpdatedEntity({
      title: 'another title',
      metadata: { prop1: [{ value: 'another value' }] },
    });
    const result = await resolver.execute(current, updated);

    expect(result.title).toBe('another title');
    expect(result.metadata!.prop1[0].value).toBe('another value');
  });

  it('should preserve AI translated title when updated has pending prefix', async () => {
    const current = buildCurrentEntity({
      title: `${SaveEntityTranslations.AITranslatedText} Hello`,
    });
    const updated = buildUpdatedEntity({
      title: `${RequestEntityTranslation.AITranslationPendingText} Hello`,
    });
    const result = await resolver.execute(current, updated);

    expect(result.title).toBe(`${SaveEntityTranslations.AITranslatedText} Hello`);
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should preserve AI translated metadata when updated has pending prefix', async () => {
    const current = buildCurrentEntity({
      metadata: { prop1: [{ value: `${SaveEntityTranslations.AITranslatedText} texto` }] },
    });
    const updated = buildUpdatedEntity({
      metadata: {
        prop1: [{ value: `${RequestEntityTranslation.AITranslationPendingText} texto` }],
      },
    });
    const result = await resolver.execute(current, updated);

    expect(result.metadata!.prop1[0].value).toBe(
      `${SaveEntityTranslations.AITranslatedText} texto`
    );
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should allow regular user edit to overwrite AI translated value', async () => {
    const current = buildCurrentEntity({
      metadata: { prop1: [{ value: `${SaveEntityTranslations.AITranslatedText} texto` }] },
    });
    const updated = buildUpdatedEntity({
      metadata: { prop1: [{ value: 'user manual edit' }] },
    });
    const result = await resolver.execute(current, updated);

    expect(result.metadata!.prop1[0].value).toBe('user manual edit');
  });
});
