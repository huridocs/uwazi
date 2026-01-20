import { IdGeneratorFactory } from '#api/core/infrastructure/factories/IdGeneratorFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { SettingsDataSourceFactory } from '#api/core/infrastructure/factories/SettingsDataSourceFactory.js';
import { DefaultRelationshipTypesDataSource } from '#api/relationshiptypes.v2/database/data_source_defaults.js';
import { CreateTemplateUseCase } from '#api/core/application/CreateTemplate.js';
import { LegacyTranslationService } from '#api/core/infrastructure/mongodb/template/LegacyTemplatesTranslationService.js';
import { MongoThesauriDataSource } from '#api/core/infrastructure/mongodb/thesauri/MongoThesauriDS.js';
import { LegacyPageService } from '#api/core/infrastructure/mongodb/page/LegacyPageService.js';
import { getConnection } from '#api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant.js';

class CreateTemplateUseCaseFactory {
  static create() {
    const transactionManager = TransactionManagerFactory.default();
    const thesauriDS = new MongoThesauriDataSource(getConnection(), transactionManager);
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const translationService = new LegacyTranslationService();
    const settingsDS = SettingsDataSourceFactory.default(transactionManager);
    const idGenerator = IdGeneratorFactory.default();
    const pageService = new LegacyPageService();
    const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);

    const useCase = new CreateTemplateUseCase({
      idGenerator,
      templatesDS,
      thesauriDS,
      translationService,
      settingsDS,
      relationshipTypesDS,
      transactionManager,
      pageService,
    });

    return useCase;
  }
}

export { CreateTemplateUseCaseFactory };
