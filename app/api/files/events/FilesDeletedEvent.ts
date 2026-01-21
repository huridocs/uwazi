import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';
import { FileType } from '#shared/types/fileType.js';

interface FilesDeletedData {
  files: FileType[];
}

class FilesDeletedEvent extends AbstractEvent<FilesDeletedData> { }

export { FilesDeletedEvent };
