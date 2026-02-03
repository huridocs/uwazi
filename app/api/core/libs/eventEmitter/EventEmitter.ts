import { Event } from './Event.js';
import { Listener } from './Listener.js';

interface EventEmitter {
  emit(event: Event<any>): Promise<void>;
  listen(listener: typeof Listener): void;
}

export type { EventEmitter };
