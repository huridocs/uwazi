import type { Listener } from './Listener.js';

type ListenerEntry = {
  listener: typeof Listener<any, any>;
  factory: () => Listener<any, any>;
};

/** A module's V2 listeners with the factories that build them; generated, never written by hand. */
type ListenerManifest = ListenerEntry[];

export type { ListenerEntry, ListenerManifest };
