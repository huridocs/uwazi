import { DefaultTransactionManager } from './common.v2/database/data_source_defaults';
import { getConnection } from './common.v2/database/getConnectionForCurrentTenant';
import { TemplatePostProcessListener } from './core/infrastructure/listeners/TemplatePostProcessListener';
import { DefaultDispatcher } from './core/libs/queue/configuration/factories';
import { MongoMultiLanguageEntityDataSource } from './entities.v2/database/MongoMultiLanguageEntityDataSource';
import { EventsBus } from './eventsbus';
import { AutomaticTranslationFactory } from './externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { PXEntityDeletedListener } from './paragraphExtraction/infrastructure/PXEntityDeletedListener';
import { PXEntityUpdatedListener } from './paragraphExtraction/infrastructure/PXEntityUpdatedListener';
import { PXFilesDeletedListener } from './paragraphExtraction/infrastructure/PXFilesDeletedListener';
import { PXFileUpdatedListener } from './paragraphExtraction/infrastructure/PXFileUpdatedListener';
import { registerEventListeners as registerSegmentationListeners } from './services/pdfsegmentation/eventListeners';
import { Suggestions } from './suggestions/suggestions';
import { DefaultTemplatesDataSource } from './templates.v2/database/data_source_defaults';
import { tenants } from './tenants';

const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
  registerSegmentationListeners(eventsBus);
  AutomaticTranslationFactory.defaultATEntityCreationListener(eventsBus).start();
  new PXFileUpdatedListener(eventsBus).start();
  new PXFilesDeletedListener(eventsBus).start();
  new PXEntityDeletedListener(eventsBus).start();
  new PXEntityUpdatedListener(eventsBus).start();

  new TemplatePostProcessListener(eventsBus, async () => {
    const transactionManager = DefaultTransactionManager();
    const templatesDS = DefaultTemplatesDataSource(transactionManager);
    const entitiesDS = new MongoMultiLanguageEntityDataSource(
      getConnection(),
      transactionManager,
      templatesDS
    );

    const jobsDispatcher = await DefaultDispatcher(tenants.current().name);

    return {
      entitiesDS,
      jobsDispatcher,
      templatesDS,
    };
  }).start();
};

export { registerEventListeners };
