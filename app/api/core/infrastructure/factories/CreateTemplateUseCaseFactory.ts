import { IdGeneratorFactory } from 'api/core/infrastructure/factories/IdGeneratorFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { CreateTemplateUseCase } from 'api/core/application/CreateTemplate';
import { LegacyTranslationService } from '../mongodb/template/LegacyTemplatesTranslationService';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDS';
import { LegacyPageService } from '../mongodb/page/LegacyPageService';

class CreateTemplateUseCaseFactory {
  static create() {
    const transactionManager = TransactionManagerFactory.default();
    const templatesDS = TemplatesDataSourceFactory.default(transactionManager);
    const thesauriDS = new MongoThesauriDataSource();
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
