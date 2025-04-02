import { DenormalizeEntityInMemoryTestJob } from '../queueRegistry';
import { EntityCreatedEvent } from './entities/events/EntityCreatedEvent';
import { EventsBus } from './eventsbus';
import { AutomaticTranslationFactory } from './externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { PXEntityDeletedListener } from './paragraphExtraction/infrastructure/PXEntityDeletedListener';
import { PXEntityUpdatedListener } from './paragraphExtraction/infrastructure/PXEntityUpdatedListener';
import { PXFilesDeletedListener } from './paragraphExtraction/infrastructure/PXFilesDeletedListener';
import { PXFileUpdatedListener } from './paragraphExtraction/infrastructure/PXFileUpdatedListener';
import { DefaultDispatcher } from './queue.v2/configuration/factories';
import { registerEventListeners as registerSegmentationListeners } from './services/pdfsegmentation/eventListeners';
import { Suggestions } from './suggestions/suggestions';
import { tenants } from './tenants';

const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
  registerSegmentationListeners(eventsBus);
  AutomaticTranslationFactory.defaultATEntityCreationListener(eventsBus).start();
  new PXFileUpdatedListener(eventsBus).start();
  new PXFilesDeletedListener(eventsBus).start();
  new PXEntityDeletedListener(eventsBus).start();
  new PXEntityUpdatedListener(eventsBus).start();

  eventsBus.on(EntityCreatedEvent, async event => {
    if (!tenants.current().featureFlags?.deactivateTestJob && event.entities[0]) {
      const dispatcher = await DefaultDispatcher(tenants.current().name);
      await dispatcher.dispatch(DenormalizeEntityInMemoryTestJob, {
        sharedId: event.entities[0].sharedId!,
        tenantName: tenants.current().name,
      });
    }
  });
};

export { registerEventListeners };
