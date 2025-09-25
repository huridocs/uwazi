
import { AbstractEvent } from '../eventsbus.js';

import { FileType } from 'shared/types/fileType.js';

interface FileUpdatedData {
  before: FileType;
  after: FileType;
}

class FileUpdatedEvent extends AbstractEvent<FileUpdatedData> {}

export { FileUpdatedEvent };
