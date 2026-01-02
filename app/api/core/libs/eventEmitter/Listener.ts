import { DispatchableClass } from '../queue/application/contracts/JobsDispatcher';
import { UserAwareDispatchable } from '../queue/application/contracts/UserAwareDispatchable';
import { Event } from './Event';

abstract class Listener<Payload extends Event> extends UserAwareDispatchable<Payload['payload']> {
  static eventName: string;

  static asJob() {
    const listenerName = this.name;
    const { eventName } = this;

    return {
      name: `${eventName}:${listenerName}`,
    } as DispatchableClass<any>;
  }
}

export { Listener };
