import { AbstractEvent } from '#api/core/libs/eventsbus/AbstractEvent.js';
import { EventsBus } from '#api/core/libs/eventsbus/EventsBus.js';

const applicationEventsBus = new EventsBus();

export { EventsBus, AbstractEvent, applicationEventsBus };
