import { z } from 'zod';
import { DispatchableClass } from '../queue/application/contracts/JobsDispatcher.js';
import { PRIVILEGED_JOB_MARKER, isPrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { Event } from './Event.js';

const JobSchema = z.object({
  listenerName: z.string().min(1),
  eventName: z.string().min(1),
});

type Dependencies<T> = {} & T;

export abstract class Listener<
  Payload extends Event<any>,
  ExtendedDeps = {},
> extends UwaziJobHandler<Payload['payload']> {
  static readonly eventName: string;

  constructor(protected deps: Dependencies<ExtendedDeps>) {
    super();
  }

  static asJob() {
    const { eventName, listenerName } = JobSchema.parse({
      listenerName: this.name,
      eventName: this.eventName,
    });

    const result = { name: `${eventName}:${listenerName}` } as any;
    if (isPrivilegedJob(this)) {
      Object.defineProperty(result, PRIVILEGED_JOB_MARKER, {
        value: true,
        writable: false,
        configurable: false,
      });
    }
    return result as DispatchableClass<any>;
  }
}
