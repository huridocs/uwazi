import { Event } from '#api/core/libs/eventEmitter/Event.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

type Payload = {
  language: LanguageISO6391;
  userId: string;
};

class LanguageDeletedEvent extends Event<Payload> {}

export { LanguageDeletedEvent };
export type { Payload as LanguageDeletedEventPayload };
