import { EventsBus } from './core/libs/eventsbus/index.js';
import { AutomaticTranslationFactory } from './externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
import { PXEntityDeletedListener } from './paragraphExtraction/infrastructure/PXEntityDeletedListener.js';
import { PXEntityUpdatedListener } from './paragraphExtraction/infrastructure/PXEntityUpdatedListener.js';
import { PXFilesDeletedListener } from './paragraphExtraction/infrastructure/PXFilesDeletedListener.js';
import { PXFileUpdatedListener } from './paragraphExtraction/infrastructure/PXFileUpdatedListener.js';
import { registerEventListeners as registerOcrListeners } from './services/ocr/eventListeners.js';
import { registerEventListeners as registerSegmentationListeners } from './services/pdfsegmentation/eventListeners.js';
import { Suggestions } from './suggestions/suggestions.js';

const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
  registerOcrListeners(eventsBus);
  registerSegmentationListeners(eventsBus);
  AutomaticTranslationFactory.defaultATEntityCreationListener(eventsBus).start();
  new PXFileUpdatedListener(eventsBus).start();
  new PXFilesDeletedListener(eventsBus).start();
  new PXEntityDeletedListener(eventsBus).start();
  new PXEntityUpdatedListener(eventsBus).start();
};

export { registerEventListeners };
