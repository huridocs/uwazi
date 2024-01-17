import { EventsBus } from './eventsbus/index.js';
import { registerEventListeners as registerSegmentationListeners } from './services/pdfsegmentation/eventListeners.js';
import { Suggestions } from './suggestions/suggestions.js';

const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
  registerSegmentationListeners(eventsBus);
};

export { registerEventListeners };
