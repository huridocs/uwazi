import { Queue } from 'bullmq';

import { Emitter } from 'api/common.v2/contracts/emitter/Emitter';
import { Event } from 'api/common.v2/contracts/emitter/Event';

type BullMQEventForwarderDependencies = {
  queue: Queue;
  emitter: Emitter;
  eventName: string;
};

class BullMQEventForwarder {
  constructor(private dependencies: BullMQEventForwarderDependencies) {
    this.dependencies.emitter.listen(this.dependencies.eventName, this.enqueueEvent.bind(this));
  }

  private enqueueEvent(event: Event) {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.dependencies.queue.add(this.dependencies.eventName, JSON.stringify(event));
  }

  get queue() {
    return this.dependencies.queue;
  }
}

export { BullMQEventForwarder };
