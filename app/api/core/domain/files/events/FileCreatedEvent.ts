import { Event } from '#api/core/libs/eventEmitter/Event.js';
import { FileDTO } from '../domainTypes.js';

type Payload = {
  file: FileDTO;
};

class FileCreatedEvent extends Event<Payload> {}

export { FileCreatedEvent };
export type { Payload as FileCreatedEventPayload };
