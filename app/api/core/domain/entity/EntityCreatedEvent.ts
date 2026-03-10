import { Event } from 'api/core/libs/eventEmitter/Event';

type Payload = {
  sharedId: string;
};

class EntityCreatedEvent extends Event<Payload> {}

export { EntityCreatedEvent };
