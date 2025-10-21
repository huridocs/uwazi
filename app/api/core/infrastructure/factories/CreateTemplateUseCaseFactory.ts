import {
  DefaultIdGenerator,
  DefaultTransactionManager,
} from 'api/common.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { CreateTemplateUseCase } from 'api/core/application/CreateTemplate';
import { LegacyTranslationService } from '../mongodb/template/LegacyTemplatesTranslationService';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDS';
import { LegacyPageService } from '../mongodb/page/LegacyPageService';

class CreateTemplateUseCaseFactory {
  static create() {
    const transactionManager = DefaultTransactionManager();
    const templatesDS = DefaultTemplatesDataSource(transactionManager);
    const thesauriDS = new MongoThesauriDataSource();
    const translationService = new LegacyTranslationService();
    const settingsDS = DefaultSettingsDataSource(transactionManager);
    const idGenerator = DefaultIdGenerator;
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
