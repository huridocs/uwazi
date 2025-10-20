import { AbstractEvent } from 'api/core/libs/eventsbus';
import { FileType } from 'shared/types/fileType';

interface FilesDeletedData {
  files: FileType[];
}

class FilesDeletedEvent extends AbstractEvent<FilesDeletedData> {}

export { FilesDeletedEvent };
