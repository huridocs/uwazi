import { FilesDataSource } from '#api/core/application/contracts/FilesDataSource.js';
import { FileStorage } from '#api/core/application/contracts/FileStorage.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { AbstractUseCase } from '#api/core/libs/UseCase.js';
import { ImageThumbnailRenderer } from './contracts/ImageThumbnailRenderer.js';
import {
  imageNeedsThumbnail,
  imageThumbnailLocation,
  imageThumbnailSkipLocation,
} from '../domain/imageThumbnail.js';
import {
  ImageThumbnailRejected,
  ImageThumbnailUnavailable,
} from '../domain/imageThumbnailErrors.js';

type Input = {
  filename: string;
};

type Deps = {
  filesDS: FilesDataSource;
  fileStorage: FileStorage;
  renderer: ImageThumbnailRenderer;
};

const skipMarker = () =>
  new FileContents(async function* marker() {
    yield new Uint8Array([0]);
  });

const rejectionFor = (failure: Error): ImageThumbnailRejected | undefined => {
  if (failure instanceof ImageThumbnailUnavailable) {
    return undefined;
  }
  if (failure instanceof ImageThumbnailRejected) {
    return failure;
  }
  return new ImageThumbnailRejected(failure);
};

class CreateImageThumbnail extends AbstractUseCase<Input, void, Deps, [boolean]> {
  async execute({ filename }: Input, giveUp: boolean): Promise<void> {
    if (await this.alreadySettled(filename)) {
      return;
    }

    const parent = await this.deps.filesDS.getByFilename(filename);
    if (parent.isError()) {
      return;
    }

    const file = parent.getData();
    try {
      const jpeg = await this.deps.renderer.render(
        this.deps.fileStorage.getFile({ type: file.type, filename: file.filename })
      );
      await this.deps.fileStorage.storeContent(jpeg, imageThumbnailLocation(filename));
    } catch (error) {
      await this.giveUpOrRethrow(filename, error, giveUp);
    }
  }

  private async alreadySettled(filename: string) {
    if (!imageNeedsThumbnail(filename)) {
      return true;
    }
    if (await this.deps.fileStorage.fileExists(imageThumbnailLocation(filename))) {
      return true;
    }
    return this.deps.fileStorage.fileExists(imageThumbnailSkipLocation(filename));
  }

  private async giveUpOrRethrow(filename: string, error: unknown, giveUp: boolean): Promise<never> {
    const failure = error instanceof Error ? error : new Error(String(error));
    const rejected = rejectionFor(failure);
    if (rejected || giveUp) {
      await this.writeSkip(filename);
    }
    throw rejected ?? failure;
  }

  private async writeSkip(filename: string) {
    const location = imageThumbnailSkipLocation(filename);
    if (await this.deps.fileStorage.fileExists(location)) {
      return;
    }
    await this.deps.fileStorage.storeContent(skipMarker(), location);
  }
}

export { CreateImageThumbnail };
