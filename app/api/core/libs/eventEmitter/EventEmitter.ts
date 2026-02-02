import { Event } from './Event';
import { Listener } from './Listener';

interface EventEmitter {
  emit(event: Event<any>): Promise<void>;
  listen(listener: typeof Listener): void;
  reset(): void;
}

export type { EventEmitter };
