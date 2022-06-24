import { AbstractEvent } from './AbstractEvent';
import { EventsBus } from './EventsBus';

const applicationEventsBus = new EventsBus();

export { EventsBus, AbstractEvent, applicationEventsBus };
