import {
  DefaultIdGenerator,
  DefaultTransactionManager,
} from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { UpdateTemplateUseCase } from 'api/core/application/UpdateTemplate';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { applicationEventsBus } from 'api/eventsbus';
import { LegacyTranslationService } from '../mongodb/template/LegacyTemplatesTranslationService';
import { MongoThesauriDataSource } from '../mongodb/thesauri/MongoThesauriDS';

class UpdateTemplateUseCaseFactory {
  static create() {
    const transactionManager = DefaultTransactionManager();
    const templatesDS = DefaultTemplatesDataSource(transactionManager);
    const entitiesDS = new MongoMultiLanguageEntityDataSource(
      getConnection(),
      transactionManager,
      templatesDS
    );
    const thesauriDS = new MongoThesauriDataSource();
    const translationService = new LegacyTranslationService();
    const settingsDS = DefaultSettingsDataSource(transactionManager);
    const relationshipTypesDS = DefaultRelationshipTypesDataSource(transactionManager);
    const idGenerator = DefaultIdGenerator;
    const eventBus = applicationEventsBus;

    const useCase = new UpdateTemplateUseCase({
      idGenerator,
      eventBus,
      transactionManager,
      templatesDS,
      entitiesDS,
      thesauriDS,
      translationService,
      settingsDS,
      relationshipTypesDS,
    });

    return useCase;
  }
}

export { UpdateTemplateUseCaseFactory };
