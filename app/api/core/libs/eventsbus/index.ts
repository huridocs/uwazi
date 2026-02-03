import { AbstractEvent } from './AbstractEvent.js';
import { EventsBus } from './EventsBus.js';

const applicationEventsBus = new EventsBus();

export { EventsBus, AbstractEvent, applicationEventsBus };
