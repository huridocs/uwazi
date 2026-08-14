import { ContextType } from '#shared/translationSchema.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { RelationshipType } from '#api/core/domain/relationshipType/RelationshipType.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TranslationsDataSourceFactory } from '#api/core/infrastructure/factories/TranslationsDataSourceFactory.js';
import { TranslationsServiceFactory } from '#api/core/infrastructure/factories/TranslationsServiceFactory.js';
import { TranslationsQueryServiceFactory } from '#api/core/infrastructure/factories/TranslationsQueryServiceFactory.js';
import { toIndexedTranslations } from '#api/core/infrastructure/express/translation/LegacyTranslationDtoMapper.js';
import { RelationshipTypeTranslationService } from '../RelationshipTypeTranslationService.js';

const factory = getFixturesFactory();
const createTranslationDBO = factory.v2.database.translationDBO;

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  translationsV2: [
    createTranslationDBO('Library', 'Library', 'en', {
      id: 'System',
      label: 'System',
      type: ContextType.uwaziUI,
    }),
    createTranslationDBO('Library', 'Biblioteca', 'es', {
      id: 'System',
      label: 'System',
      type: ContextType.uwaziUI,
    }),
  ],
};

const createSut = () => {
  const transactionManager = TransactionManagerFactory.default();
  return {
    transactionManager,
    sut: new RelationshipTypeTranslationService({
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
      translationsDS: TranslationsDataSourceFactory.default({ transactionManager }),
    }),
  };
};

describe('RelationshipTypeTranslationService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create translation context', async () => {
    const relationshipType = new RelationshipType('type-id', 'Parent');

    await testingEnvironment.runWithContext(async () => {
      const { sut, transactionManager } = createSut();
      await transactionManager.run(async () => {
        await sut.create(relationshipType);
      });
    });

    const translationWithContext = await testingEnvironment.runWithContext(async () => {
      const [translation] = toIndexedTranslations(
        await TranslationsQueryServiceFactory.default().getLegacy({
          locale: 'en',
          context: 'type-id',
        })
      );
      return translation;
    });

    expect(translationWithContext.contexts).toHaveLength(1);
    expect(translationWithContext.contexts?.[0]).toMatchObject({
      id: 'type-id',
      label: 'Parent',
      type: ContextType.relationshipType,
      values: { Parent: 'Parent' },
    });
  });

  it('should update translation context', async () => {
    await testingEnvironment.runWithContext(async () => {
      const { sut, transactionManager } = createSut();
      await transactionManager.run(async () => {
        await sut.create(new RelationshipType('type-id', 'Old'));
        await sut.update(
          new RelationshipType('type-id', 'Old'),
          new RelationshipType('type-id', 'New')
        );
      });
    });

    const translationWithContext = await testingEnvironment.runWithContext(async () => {
      const [translation] = toIndexedTranslations(
        await TranslationsQueryServiceFactory.default().getLegacy({
          locale: 'en',
          context: 'type-id',
        })
      );
      return translation;
    });

    expect(translationWithContext.contexts).toHaveLength(1);
    expect(translationWithContext.contexts?.[0]).toMatchObject({
      id: 'type-id',
      label: 'New',
      type: ContextType.relationshipType,
      values: { New: 'New' },
    });
  });

  it('should delete translation context', async () => {
    await testingEnvironment.runWithContext(async () => {
      const { sut, transactionManager } = createSut();
      await transactionManager.run(async () => {
        await sut.create(new RelationshipType('type-id', 'Parent'));
        await sut.delete('type-id');
      });
    });

    const translationWithContext = await testingEnvironment.runWithContext(async () =>
      toIndexedTranslations(
        await TranslationsQueryServiceFactory.default().getLegacy({
          locale: 'en',
          context: 'type-id',
        })
      )
    );
    expect(translationWithContext).toEqual([
      expect.objectContaining({ locale: 'en', contexts: [] }),
    ]);
  });
});
