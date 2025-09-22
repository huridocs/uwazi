import { AbstractEvent } from '../eventsbus.js';
import { FileType } from '../../shared/types/fileType.js';

interface FilesDeletedData {
  files: FileType[];
}

class FilesDeletedEvent extends AbstractEvent<FilesDeletedData> {}

export { FilesDeletedEvent };
