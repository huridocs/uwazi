import { DomainError } from 'api/core/domain/error/DomainError';
import { Document } from './Document';

export class ProcessingFileNotFound extends DomainError {
  constructor(fileId: string) {
    super(`The File with Id "${fileId}" was not found.`, 'file.processing_file_not_found');
  }
}

export class ProcessingFileFailed extends DomainError {
  readonly file: Document;

  constructor(file: Document) {
    super(`Failed PostProcess for file with Id "${file.id}"`, 'file.post_proces_failed');
    this.file = file;
  }
}
