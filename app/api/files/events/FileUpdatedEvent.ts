import { AbstractEvent } from 'api/core/libs/eventsbus';
import { FileType } from 'shared/types/fileType';

interface FileUpdatedData {
  before: FileType;
  after: FileType;
}

class FileUpdatedEvent extends AbstractEvent<FileUpdatedData> {}

export { FileUpdatedEvent };
