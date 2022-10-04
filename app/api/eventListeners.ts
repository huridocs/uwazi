import { registerEventListeners as registerEntityListeners } from './entities/eventListeners';
import { EventsBus } from './eventsbus';
import { registerEventListeners as registerSegmentationListeners } from './services/pdfsegmentation/eventListeners';
import { Suggestions } from './suggestions/suggestions';

const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
  registerSegmentationListeners(eventsBus);
  registerEntityListeners(eventsBus);
};

export { registerEventListeners };
