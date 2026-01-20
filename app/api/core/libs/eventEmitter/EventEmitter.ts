import { Event } from '#api/core/libs/eventEmitter/Event.js';
import { Listener } from '#api/core/libs/eventEmitter/Listener.js';

interface EventEmitter {
  emit(event: Event<any>): Promise<void>;
  listen(listener: typeof Listener): void;
}

export type { EventEmitter };
