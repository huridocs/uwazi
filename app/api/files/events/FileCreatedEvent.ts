import { AbstractEvent } from 'api/eventsbus';
import { FileType } from 'shared/types/fileType';

interface FileCreationData {
  new: FileType;
}

class FileCreatedEvent extends AbstractEvent<FileCreationData> {}

export { FileCreatedEvent };
