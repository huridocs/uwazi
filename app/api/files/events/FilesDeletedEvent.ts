import { AbstractEvent } from 'api/eventsbus';
import { FileType } from '../../shared/types/fileType.js';

interface FilesDeletedData {
  files: FileType[];
}

class FilesDeletedEvent extends AbstractEvent<FilesDeletedData> {}

export { FilesDeletedEvent };
