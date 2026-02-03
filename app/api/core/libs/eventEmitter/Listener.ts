import { z } from 'zod';
import { DispatchableClass } from '../queue/application/contracts/JobsDispatcher.js';
import { UserAwareDispatchable } from '../queue/application/contracts/UserAwareDispatchable.js';
import { Event } from './Event.js';

const JobSchema = z.object({
  listenerName: z.string().min(1),
  eventName: z.string().min(1),
});

abstract class Listener<Payload extends Event<any>> extends UserAwareDispatchable<
  Payload['payload']
> {
  static readonly eventName: string;

  static asJob() {
    const { eventName, listenerName } = JobSchema.parse({
      listenerName: this.name,
      eventName: this.eventName,
    });

    return {
      name: `${eventName}:${listenerName}`,
    } as DispatchableClass<any>;
  }
}

export { Listener };
