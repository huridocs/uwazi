import { Event, EventPayload } from '#api/core/libs/eventEmitter/Event.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { Entity } from './Entity.js';
import { EntityDTO } from './EntityDTO.js';

type Payload = {
  before: EntityDTO;
  after: EntityDTO;
  /** The language of the update request. Workers deployed before `changedLanguages` read only this. */
  targetLanguage: LanguageISO6391;
  changedLanguages: LanguageISO6391[];
};

/** Shape of events queued before `changedLanguages` existed; they may still be in the queue. */
type PayloadWithoutChangedLanguages = Omit<Payload, 'changedLanguages'>;

type CreateProps = EventPayload<{
  entity: Entity;
  targetLanguage: LanguageISO6391;
}>;

class EntityUpdatedEvent extends Event<Payload> {
  constructor(payload: EventPayload<Payload>) {
    super(payload);
  }

  static create({ entity, userId, targetLanguage }: CreateProps) {
    const { changedLanguages } = entity;
    if (changedLanguages.length === 0) return null;

    return new EntityUpdatedEvent({
      after: entity.asDTO,
      before: entity.previousVersion.asDTO,
      userId,
      targetLanguage,
      changedLanguages,
    });
  }

  static changedLanguagesOf(payload: Payload | PayloadWithoutChangedLanguages): LanguageISO6391[] {
    return 'changedLanguages' in payload ? payload.changedLanguages : [payload.targetLanguage];
  }
}

export { EntityUpdatedEvent };

export type { Payload as EntityUpdatedEventPayload };
