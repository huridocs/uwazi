import { Event } from '#api/core/libs/eventEmitter/Event.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

type Payload = {
  language: LanguageISO6391;
  defaultLanguage: LanguageISO6391;
  userId: string;
};

class LanguageAddedEvent extends Event<Payload> {}

export { LanguageAddedEvent };
export type { Payload as LanguageAddedEventPayload };
