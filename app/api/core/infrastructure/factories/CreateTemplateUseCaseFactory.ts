import { CreateTemplateUseCase } from '#api/core/application/CreateTemplate.js';
import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { LegacyPageServiceFactory } from '#api/pages.v2/infrastructure/factories/LegacyPageServiceFactory.js';
import { DefaultRelationshipTypesDataSource } from '#api/relationshiptypes.v2/database/data_source_defaults.js';
import { LegacyTranslationService } from '../mongodb/template/LegacyTemplatesTranslationService.js';
import { ThesauriDataSourceFactory } from './ThesauriDataSourceFactory.js';

class CreateTemplateUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof CreateTemplateUseCase>[0]>) {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = ThesauriDataSourceFactory.default({ transactionManager });
    const templatesDS = TemplatesDataSourceFactory.default({ transactionManager });
    const translationService = new LegacyTranslationService();
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const idGenerator = IdGeneratorFactory.default();
    const pageService = LegacyPageServiceFactory.default({ transactionManager });
    const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);

    return new CreateTemplateUseCase({
      idGenerator,
      templatesDS,
      thesauriDS,
      translationService,
      settingsDS,
      relationshipTypesDS,
      transactionManager,
      pageService,
      ...overrides,
    });
  }
}

export { CreateTemplateUseCaseFactory };
