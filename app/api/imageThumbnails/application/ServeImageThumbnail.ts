import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { BaseFile } from '#api/core/domain/files/BaseFile.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { FileType } from '#api/core/domain/files/FileType.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { EnqueueImageThumbnails } from './EnqueueImageThumbnails.js';
import {
  imageNeedsThumbnail,
  imageThumbnailLocation,
  imageThumbnailSkipLocation,
} from '../domain/imageThumbnail.js';

type Input = {
  filename: string;
};

type Output =
  | { status: 'not_found' }
  | {
      status: 'ok';
      file: BaseFile;
      contents: FileContents;
      contentType: string;
      cache: 'default' | 'no-store';
    };

type Deps = {
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
  enqueueImageThumbnails: EnqueueImageThumbnails;
};

const PARENT_TYPES: FileType[] = ['document', 'attachment', 'custom'];

class ServeImageThumbnail extends AbstractUseCase<Input, Output, Deps> {
  async execute({ filename }: Input): Promise<Output> {
    const storedThumbnail = await this.storedThumbnail(filename);
    if (storedThumbnail) {
      return storedThumbnail;
    }
    return this.serveParent(filename);
  }

  private async serveParent(filename: string): Promise<Output> {
    const parent = await this.deps.filesDS.getByFilename(filename, PARENT_TYPES);
    if (parent.isError()) {
      return { status: 'not_found' };
    }

    const file = parent.getData();
    if (!(await this.deps.fileStorage.fileExists(file))) {
      return { status: 'not_found' };
    }
    if (!imageNeedsThumbnail(file.filename)) {
      return this.original(file);
    }
    return this.serveImage(file);
  }

  private async serveImage(file: BaseFile): Promise<Output> {
    if (await this.deps.fileStorage.locationExists(imageThumbnailLocation(file.filename))) {
      return {
        status: 'ok',
        file,
        contents: this.deps.fileStorage.getFile(imageThumbnailLocation(file.filename)),
        contentType: 'image/jpeg',
        cache: 'default',
      };
    }

    if (!(await this.deps.fileStorage.locationExists(imageThumbnailSkipLocation(file.filename)))) {
      await this.deps.enqueueImageThumbnails.execute([file.filename]);
    }
    return this.original(file);
  }

  private async storedThumbnail(filename: string): Promise<Output | undefined> {
    const thumbnail = await this.deps.filesDS.getByFilename(filename, ['thumbnail']);
    if (thumbnail.isError()) {
      return undefined;
    }
    const file = thumbnail.getData();
    if (!(await this.deps.fileStorage.fileExists(file))) {
      return { status: 'not_found' };
    }
    return {
      status: 'ok',
      file,
      contents: this.deps.fileStorage.getFile({ type: file.type, filename: file.filename }),
      contentType: file.mimetype || 'image/jpeg',
      cache: 'default',
    };
  }

  private original(file: BaseFile): Output {
    return {
      status: 'ok',
      file,
      contents: this.deps.fileStorage.getFile({ type: file.type, filename: file.filename }),
      contentType: file.mimetype || 'application/octet-stream',
      cache: 'no-store',
    };
  }
}

export { ServeImageThumbnail };
export type { Output as ServeImageThumbnailOutput };
