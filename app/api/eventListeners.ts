import { EventsBus } from './eventsbus';
import { Suggestions } from './suggestions/suggestions';

export const registerEventListeners = (eventsBus: EventsBus) => {
  Suggestions.registerEventListeners(eventsBus);
};
