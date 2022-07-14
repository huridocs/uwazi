import { AbstractEvent } from 'api/eventsbus';
import { FileType } from 'shared/types/fileType';

interface FileCreationData {
  newFile: FileType;
}

class FileCreatedEvent extends AbstractEvent<FileCreationData> {}

export { FileCreatedEvent };
