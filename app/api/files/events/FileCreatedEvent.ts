import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';

import { WithId } from '#api/odm/index.js';

import { FileType } from '#shared/types/fileType.js';

interface FileCreationData {
  newFile: WithId<FileType>;
}

class FileCreatedEvent extends AbstractEvent<FileCreationData> {}

export { FileCreatedEvent };
