import { config } from '#api/config.js';
import { FilesDataSourceFactory } from '#api/core/infrastructure/factories/FilesDataSourceFactory.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { FileStorageFactory } from '#api/core/infrastructure/files/FileStorageFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { CreateImageThumbnail } from '../../application/CreateImageThumbnail.js';
import { runCommand } from '../files/commandRunner.js';
import { HttpImageThumbnailRenderer } from '../files/HttpImageThumbnailRenderer.js';
import { libvipsVersionOf } from '../files/libvipsVersion.js';
import { PreferSystemVipsRenderer } from '../files/PreferSystemVipsRenderer.js';
import { SharpImageThumbnailRenderer } from '../files/SharpImageThumbnailRenderer.js';
import { VipsImageThumbnailRenderer } from '../files/VipsImageThumbnailRenderer.js';

const readSystemVipsVersion = async () => {
  const result = await runCommand('vips', ['--version']);
  if (result.isError()) {
    return undefined;
  }
  return libvipsVersionOf(result.getDataOrThrow());
};

let systemVersion: Promise<string | undefined> | undefined;

const systemVipsVersion = async () => {
  systemVersion ??= readSystemVipsVersion();
  return systemVersion;
};

class CreateImageThumbnailFactory {
  static default(overrides: Partial<ConstructorParameters<typeof CreateImageThumbnail>[0]> = {}) {
    const fileIO = new FileContentsIO();
    const renderer = config.thumbnailGeneratorUrl
      ? new HttpImageThumbnailRenderer({
          baseUrl: config.thumbnailGeneratorUrl,
          fileIO,
        })
      : new PreferSystemVipsRenderer(
          systemVipsVersion,
          new VipsImageThumbnailRenderer({ execute: runCommand }, fileIO),
          new SharpImageThumbnailRenderer(fileIO)
        );
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
