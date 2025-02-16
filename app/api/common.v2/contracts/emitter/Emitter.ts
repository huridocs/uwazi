import { Event } from './Event';

type Callback = (event: Event) => void;

interface Emitter {
  emit(event: Event): void;
  listen(name: string, callback: Callback): void;
}

export type { Emitter, Callback };
