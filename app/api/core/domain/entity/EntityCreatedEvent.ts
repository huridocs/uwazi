import { Event, EventPayload } from '#api/core/libs/eventEmitter/Event.js';

type Payload = {
  sharedId: string;
  userId: string;
};

class EntityCreatedEvent extends Event<Payload> {
  constructor(payload: EventPayload<Payload>) {
    super(payload);
  }

  static create(payload: EventPayload<Payload>) {
    return new EntityCreatedEvent(payload);
  }
}

export { EntityCreatedEvent };
