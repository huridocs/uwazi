import { Event } from '#api/core/libs/eventEmitter/Event.js';

type Payload = {
  fileId: string;
  filename: string;
};

class FileDeletedEvent extends Event<Payload> {}

export { FileDeletedEvent };
export type { Payload as FileDeletedEventPayload };
