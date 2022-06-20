import { EventEmitter } from 'events';

export class EventsBus extends EventEmitter {}

export const applicationEventsBus = new EventsBus();
