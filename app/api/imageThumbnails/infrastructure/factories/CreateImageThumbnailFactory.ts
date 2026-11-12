import { config } from '#api/config.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CreateImageThumbnail } from '../../application/CreateImageThumbnail.js';
import { HttpImageThumbnailRenderer } from '../files/HttpImageThumbnailRenderer.js';
import { SharpImageThumbnailRenderer } from '../files/SharpImageThumbnailRenderer.js';

class CreateImageThumbnailFactory {
  static default(overrides: Partial<ConstructorParameters<typeof CreateImageThumbnail>[0]> = {}) {
    const fileIO = new FileContentsIO();
    const renderer = config.thumbnailGeneratorUrl
      ? new HttpImageThumbnailRenderer({
          baseUrl: config.thumbnailGeneratorUrl,
          fileIO,
        })
      : new SharpImageThumbnailRenderer(fileIO);
    return new CreateImageThumbnail({
      transactionManager: ExecutionContext.transactionManager,
      filesDS: FilesDataSourceFactory.default(),
      fileStorage: FileStorageFactory.default(),
      renderer,
      ...overrides,
    });
  }
}

export { CreateImageThumbnailFactory };
