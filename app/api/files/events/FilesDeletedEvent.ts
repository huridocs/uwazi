import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileMappers } from '#api/core/infrastructure/mongodb/files/FilesMappers.js';
import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';
import { FileType } from '#shared/types/fileType.js';

interface FilesDeletedData {
  files: FileType[];
}

class FilesDeletedEvent extends AbstractEvent<FilesDeletedData> {
  static create(files: BaseFile[]) {
    return new FilesDeletedEvent({
      files: files.map(file => FileMappers.toDBO(file)),
    });
  }
}

export { FilesDeletedEvent };
