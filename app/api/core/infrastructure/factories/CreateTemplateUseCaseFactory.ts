import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultRelationshipTypesDataSource } from '#api/relationshiptypes.v2/database/data_source_defaults.js';
import { CreateTemplateUseCase } from '#api/core/application/CreateTemplate.js';
import { LegacyTranslationService } from '../mongodb/template/LegacyTemplatesTranslationService.js';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDS.js';
import { LegacyPageService } from '../mongodb/page/LegacyPageService.js';
import { getConnection } from '../mongodb/common/getConnectionForCurrentTenant.js';

class CreateTemplateUseCaseFactory {
  static default(overrides?: Partial<ConstructorParameters<typeof CreateTemplateUseCase>[0]>) {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
    const templatesDS = TemplatesDataSourceFactory.default({ transactionManager });
    const translationService = new LegacyTranslationService();
    const settingsDS = SettingsDataSourceFactory.default({ transactionManager });
    const idGenerator = IdGeneratorFactory.default();
    const pageService = new LegacyPageService();
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
