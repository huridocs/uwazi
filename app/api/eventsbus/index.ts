import { EventsBus } from './EventsBus';
import { AbstractEvent } from './AbstractEvent';

const applicationEventsBus = new EventsBus();

export { EventsBus, AbstractEvent, applicationEventsBus };
