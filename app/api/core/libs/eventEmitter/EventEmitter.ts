import { Event } from './Event';
import { Listener } from './Listener';

interface EventEmitter {
  emit(event: Event): Promise<void>;
  listen(listener: typeof Listener): void;
}

export type { EventEmitter };
