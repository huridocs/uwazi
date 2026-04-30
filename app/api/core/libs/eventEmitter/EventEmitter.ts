import { Event } from './Event.js';

interface EventEmitter {
  emit(event: Event<any>): Promise<void>;
}

export type { EventEmitter };
