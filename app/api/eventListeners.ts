import { EventsBus } from './core/libs/eventsbus';
import { AutomaticTranslationFactory } from './externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { PXEntityDeletedListener } from './paragraphExtraction/infrastructure/PXEntityDeletedListener';
import { PXEntityUpdatedListener } from './paragraphExtraction/infrastructure/PXEntityUpdatedListener';
import { PXFilesDeletedListener } from './paragraphExtraction/infrastructure/PXFilesDeletedListener';
import { PXFileUpdatedListener } from './paragraphExtraction/infrastructure/PXFileUpdatedListener';
import { registerEventListeners as registerSegmentationListeners } from './services/pdfsegmentation/eventListeners';
import { Suggestions } from './suggestions/suggestions';

const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
  registerSegmentationListeners(eventsBus);
  AutomaticTranslationFactory.defaultATEntityCreationListener(eventsBus).start();
  new PXFileUpdatedListener(eventsBus).start();
  new PXFilesDeletedListener(eventsBus).start();
  new PXEntityDeletedListener(eventsBus).start();
  new PXEntityUpdatedListener(eventsBus).start();
};

export { registerEventListeners };
