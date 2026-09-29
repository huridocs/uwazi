import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { EventListenerRegistry } from '#api/core/libs/eventEmitter/EventListenerRegistry.js';
import { ListenerManifest } from '#api/core/libs/eventEmitter/ListenerManifest.js';
import { Dispatchable } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { DispatchableClass } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { SegmentationComposition } from '#segmentation/composition';
import { listeners } from './listeners.generated.js';

type RegisterJob = <T extends Dispatchable>(
  dispatchable: DispatchableClass<T>,
  factory: (namespace: string) => Promise<T>
) => void;

/**
 * Every V2 listener, from core and from every package. A process that emits events must register
 * them all, or an event emitted there dispatches no job for the listeners it missed; the queue
 * worker registers their jobs so it can run them.
 */
class ListenerRegistration {
  static manifest(): ListenerManifest {
    return [...listeners, ...SegmentationComposition.listeners];
  }

  /** Safe to call more than once: a listener already registered is left as it is. */
  static registerEvents(registry: EventListenerRegistry = EventEmitterFactory.registry) {
    ListenerRegistration.manifest().forEach(({ listener }) => {
      if (!registry.getListeners(listener.eventName)?.has(listener)) {
        registry.register(listener);
      }
    });
  }

  static registerJobs(register: RegisterJob) {
    ListenerRegistration.manifest().forEach(({ listener, factory }) => {
      register(listener.asJob(), async () => factory());
    });
  }
}

export { ListenerRegistration };
