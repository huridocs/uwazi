import { EventsBus } from './eventsbus';
import { AutomaticTranslationFactory } from './externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { registerEventListeners as registerSegmentationListeners } from './services/pdfsegmentation/eventListeners';
import { Suggestions } from './suggestions/suggestions';

const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
  registerSegmentationListeners(eventsBus);
  AutomaticTranslationFactory.defaultATEntityCreationListener(eventsBus).start();
};

export { registerEventListeners };
