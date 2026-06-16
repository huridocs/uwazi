import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileMappers } from '#api/core/infrastructure/mongodb/files/FilesMappers.js';
import { AbstractEvent } from '#api/core/libs/eventsbus/index.js';
import { FileType } from '#shared/types/fileType.js';

interface FileUpdatedData {
  before: FileType;
  after: FileType;
}

class FileUpdatedEvent extends AbstractEvent<FileUpdatedData> {
  static create(file: BaseFile) {
    const after = FileMappers.toDBO(file);
    const before = FileMappers.toDBO(file.previousVersion!);

    return new FileUpdatedEvent({
      before,
      after,
    });
  }
}

export { FileUpdatedEvent };
