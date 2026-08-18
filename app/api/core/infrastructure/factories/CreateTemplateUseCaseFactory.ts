import { CreateTemplateUseCase } from '#api/core/application/CreateTemplate.js';
import { TemplateTranslationService } from '#api/core/application/templateTranslationService/TemplateTranslationService.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { LegacyPageServiceFactory } from '#api/pages.v2/infrastructure/factories/LegacyPageServiceFactory.js';
import { RelationshipTypesDataSourceFactory } from '#api/core/infrastructure/factories/RelationshipTypesDataSourceFactory.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';
import { TranslationsServiceFactory } from './TranslationsServiceFactory.js';

class CreateTemplateUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof CreateTemplateUseCase>[0]>) {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
    const templatesDS = TemplatesDataSourceFactory.default({ transactionManager });
    const templateTranslationService = new TemplateTranslationService({
      translationsService: TranslationsServiceFactory.default({ transactionManager }),
    });
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const idGenerator = IdGeneratorFactory.default();
    const pageService = LegacyPageServiceFactory.default({ transactionManager });
    const relationshipTypesDS = RelationshipTypesDataSourceFactory.default({ transactionManager });

    return new CreateTemplateUseCase({
      idGenerator,
      templatesDS,
      thesauriDS,
      templateTranslationService,
      settingsDS,
      relationshipTypesDS,
      transactionManager,
      pageService,
      ...overrides,
    });
  }
}

export { CreateTemplateUseCaseFactory };
