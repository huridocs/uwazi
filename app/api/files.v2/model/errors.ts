import { DomainError } from 'api/core/domain/error/DomainError';
import { Document } from './Document';

export class ProcessingFileNotFound extends DomainError {
  constructor(fileId: string) {
    super(`The File with Id "${fileId}" was not found.`, 'file.processing_file_not_found');
  }
}

export class ProcessingFileFailed extends DomainError {
  readonly file: Document;

  constructor(file: Document, cause: Error) {
    super(`Failed PostProcess for file with Id "${file.id}"`, 'file.post_proces_failed', cause);
    this.file = file;
  }
}

export class FileContentError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, 'file.contents.error', cause);
  }
}
