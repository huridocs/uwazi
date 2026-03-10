import { z } from 'zod';
import { DispatchableClass } from '../queue/application/contracts/JobsDispatcher';
import { UserAwareDispatchable } from '../queue/application/contracts/UserAwareDispatchable';
import { Event } from './Event';

const JobSchema = z.object({
  listenerName: z.string().min(1),
  eventName: z.string().min(1),
});

type Dependencies<T> = {} & T;

abstract class Listener<
  Payload extends Event<any>,
  ExtendedDeps = {},
> extends UserAwareDispatchable<Payload['payload']> {
  static readonly eventName: string;

  constructor(protected deps: Dependencies<ExtendedDeps>) {
    super();
  }

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
