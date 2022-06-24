import { EventsBus } from './eventsbus';
import { Suggestions } from './suggestions/suggestions';

const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
};

export { registerEventListeners };
