import { Event, EventPayload } from 'api/core/libs/eventEmitter/Event';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import { Entity } from './Entity';
import { EntityDTO } from './EntityDTO';

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
