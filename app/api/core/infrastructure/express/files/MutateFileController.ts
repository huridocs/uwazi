/* eslint-disable max-classes-per-file */
import { AbstractController } from '#api/common.v2/infrastructure/AbstractController.js';
import { DomainError } from '#api/core/domain/error/DomainError.js';
import { FileType } from '#api/core/domain/files/FileType.js';
import { CreateFileFromURLController } from './CreateFileFromURLController.js';
import { UpdateFileController } from './UpdateFileController.js';

type Request = {
  _id?: string;
  type: FileType;
};

class FileTypeNotSupportedError extends DomainError {
  constructor() {
    super('The file type is not supported for creation', 'file.file_type_not_supported');
  }
}

class MutateFileController extends AbstractController<Request> {
  protected async handle(): Promise<void> {
    if (!this.request.body?._id) {
      if (this.request.body?.type === 'attachment') {
        return CreateFileFromURLController.createHandler()(this.request, this.response);
      }

      throw new FileTypeNotSupportedError();
    }

    return UpdateFileController.createHandler()(this.request, this.response);
  }
}

export { MutateFileController };
