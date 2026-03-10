import { Event } from '#api/core/libs/eventEmitter/Event.js';

type Payload = {
  sharedId: string;
};

class EntityCreatedEvent extends Event<Payload> {}

export { EntityCreatedEvent };
