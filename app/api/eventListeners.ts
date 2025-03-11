import { DenormalizeEntityInMemoryTestJob } from '../queueRegistry';
import { EntityCreatedEvent } from './entities/events/EntityCreatedEvent';
import { EventsBus } from './eventsbus';
import { AutomaticTranslationFactory } from './externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { permissionsContext } from './permissions/permissionsContext';
import { DefaultDispatcher } from './queue.v2/configuration/factories';
import { registerEventListeners as registerSegmentationListeners } from './services/pdfsegmentation/eventListeners';
import { Suggestions } from './suggestions/suggestions';
import { tenants } from './tenants';

const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
  registerSegmentationListeners(eventsBus);
  AutomaticTranslationFactory.defaultATEntityCreationListener(eventsBus).start();

  eventsBus.on(EntityCreatedEvent, async event => {
    if (!tenants.current().featureFlags?.deactivateTestJob) {
      const dispatcher = await DefaultDispatcher(tenants.current().name);
      await dispatcher.dispatch(DenormalizeEntityInMemoryTestJob, {
        sharedId: event.entities[0].sharedId!,
        tenantName: tenants.current().name,
        userId: permissionsContext.getUserInContext()?._id?.toString()!,
      });
    }
  });
};

export { registerEventListeners };
