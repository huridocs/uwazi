import { AbstractEvent } from '../eventsbus/index.js';

import { WithId } from '../odm/index.js';

import { FileType } from '#shared/types/fileType.js';

interface FileCreationData {
  newFile: WithId<FileType>;
}

class FileCreatedEvent extends AbstractEvent<FileCreationData> {}

export { FileCreatedEvent };
