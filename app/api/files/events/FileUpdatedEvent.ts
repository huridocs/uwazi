import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';

import { FileType } from '#shared/types/fileType.js';

interface FileUpdatedData {
  before: FileType;
  after: FileType;
}

class FileUpdatedEvent extends AbstractEvent<FileUpdatedData> { }

export { FileUpdatedEvent };
