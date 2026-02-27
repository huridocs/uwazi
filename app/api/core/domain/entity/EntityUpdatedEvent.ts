import { Event, EventPayload } from '#api/core/libs/eventEmitter/Event.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Entity } from './Entity.js';
import { EntityDTO } from './EntityDTO.js';

type Payload = {
  before: EntityDTO;
  after: EntityDTO;
  targetLanguage: LanguageISO6391;
};

type CreateProps = EventPayload<{
  entity: Entity;
  targetLanguage: LanguageISO6391;
}>;

class EntityUpdatedEvent extends Event<Payload> {
  constructor(payload: EventPayload<Payload>) {
    super(payload);
  }

  static create({ entity, userId, targetLanguage }: CreateProps) {
    return new EntityUpdatedEvent({
      after: entity.asDTO,
      before: entity.previousVersion.asDTO,
      userId,
      targetLanguage,
    });
  }
}

export { EntityUpdatedEvent };

export type { Payload as EntityUpdatedEventPayload };
