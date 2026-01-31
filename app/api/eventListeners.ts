import { EventsBus } from '#api/core/libs/eventsbus/index.js';
import { AutomaticTranslationFactory } from '#api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
import { PXEntityDeletedListener } from '#api/paragraphExtraction/infrastructure/PXEntityDeletedListener.js';
import { PXEntityUpdatedListener } from '#api/paragraphExtraction/infrastructure/PXEntityUpdatedListener.js';
import { PXFilesDeletedListener } from '#api/paragraphExtraction/infrastructure/PXFilesDeletedListener.js';
import { PXFileUpdatedListener } from '#api/paragraphExtraction/infrastructure/PXFileUpdatedListener.js';
import { registerEventListeners as registerSegmentationListeners } from '#api/services/pdfsegmentation/eventListeners.js';
import { Suggestions } from '#api/suggestions/suggestions.js';

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
