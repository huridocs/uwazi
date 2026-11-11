import { randomBytes } from 'crypto';
import { tmpdir } from 'os';
import path from 'path';

import { DiskFile } from '#api/core/infrastructure/files/DiskFile.js';
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { ImageThumbnailRenderer } from '../../application/contracts/ImageThumbnailRenderer.js';
import {
  IMAGE_THUMBNAIL_JPEG_QUALITY,
  IMAGE_THUMBNAIL_LONG_EDGE,
  IMAGE_THUMBNAIL_MAX_PIXELS,
} from '../../domain/imageThumbnail.js';
import { ImageThumbnailRejected } from '../../domain/imageThumbnailErrors.js';
import { CommandRunner } from './commandRunner.js';

type ThumbnailFileIO = {
  toDisk(file: FileContents): Promise<DiskFile>;
};

const temporary = (extension: string) =>
  path.join(tmpdir(), `image-thumbnail-${randomBytes(8).toString('hex')}.${extension}`);

class VipsImageThumbnailRenderer implements ImageThumbnailRenderer {
  constructor(
    private commands: CommandRunner,
    private fileIO: ThumbnailFileIO
  ) {}

  async render(content: FileContents): Promise<FileContents> {
    const source = await this.fileIO.toDisk(content);
    await this.assertWithinPixelCeiling(source.path);
    const staged = temporary('png');
    const jpeg = temporary('jpg');
    await this.thumbnail(source.path, staged);
    await this.writeJpeg(staged, jpeg);
    return new DiskFile(jpeg).toContent();
  }

  private async assertWithinPixelCeiling(filePath: string) {
    const width = await this.dimension(filePath, 'width');
    const height = await this.dimension(filePath, 'height');
    if (width * height > IMAGE_THUMBNAIL_MAX_PIXELS) {
      throw new ImageThumbnailRejected(new Error('image exceeds the pixel ceiling'));
    }
  }

  private async dimension(filePath: string, field: 'width' | 'height' | 'bands') {
    const result = await this.commands.execute('vipsheader', ['-f', field, filePath]);
    if (result.isError()) {
      throw new ImageThumbnailRejected(result.getError() ?? new Error('vipsheader failed'));
    }
    const value = Number.parseInt(result.getDataOrThrow(), 10);
    if (!Number.isFinite(value)) {
      throw new ImageThumbnailRejected(new Error(`vipsheader returned no ${field}`));
    }
    return value;
  }

  private async thumbnail(filePath: string, staged: string) {
    const edge = String(IMAGE_THUMBNAIL_LONG_EDGE);
    const result = await this.commands.execute('vips', [
      'thumbnail',
      filePath,
      staged,
      edge,
      '--height',
      edge,
      '--size',
      'down',
    ]);
    if (result.isError()) {
      throw new ImageThumbnailRejected(result.getError() ?? new Error('vips thumbnail failed'));
    }
  }

  private async writeJpeg(staged: string, jpeg: string) {
    const bands = await this.dimension(staged, 'bands');
    if (bands === 2 || bands === 4) {
      await this.flatten(staged, jpeg, bands === 4 ? '255,255,255' : '255');
      return;
    }
    await this.copyToJpeg(staged, jpeg);
  }

  private async copyToJpeg(staged: string, jpeg: string) {
    const result = await this.commands.execute('vips', [
      'copy',
      staged,
      `${jpeg}[Q=${IMAGE_THUMBNAIL_JPEG_QUALITY}]`,
    ]);
    if (result.isError()) {
      throw new ImageThumbnailRejected(result.getError() ?? new Error('vips copy failed'));
    }
  }

  private async flatten(staged: string, jpeg: string, background: string) {
    const result = await this.commands.execute('vips', [
      'flatten',
      staged,
      `${jpeg}[Q=${IMAGE_THUMBNAIL_JPEG_QUALITY}]`,
      '--background',
      background,
    ]);
    if (result.isError()) {
      throw new ImageThumbnailRejected(result.getError() ?? new Error('vips flatten failed'));
    }
  }
}

export { VipsImageThumbnailRenderer };
