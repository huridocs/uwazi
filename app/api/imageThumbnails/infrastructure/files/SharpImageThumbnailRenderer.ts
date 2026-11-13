import { FileContents } from '#api/core/domain/files/FileContents.js';
import { FileContentsIO } from '#api/core/infrastructure/files/FileContentIO.js';
import { ImageThumbnailRenderer } from '../../application/contracts/ImageThumbnailRenderer.js';
import {
  IMAGE_THUMBNAIL_JPEG_QUALITY,
  IMAGE_THUMBNAIL_LONG_EDGE,
  IMAGE_THUMBNAIL_MAX_PIXELS,
} from '../../domain/imageThumbnail.js';
import {
  ImageThumbnailRejected,
  ImageThumbnailUnavailable,
} from '../../domain/imageThumbnailErrors.js';

const loadSharp = async () => {
  try {
    const module = await import('sharp');
    return module.default;
  } catch (error) {
    throw new ImageThumbnailUnavailable(error instanceof Error ? error : new Error(String(error)));
  }
};

class SharpImageThumbnailRenderer implements ImageThumbnailRenderer {
  constructor(private fileIO: FileContentsIO) {}

  async render(content: FileContents): Promise<FileContents> {
    const sharp = await loadSharp();
    const input = (await this.fileIO.toBuffer(content)).getDataOrThrow();
    try {
      const output = await sharp(input, {
        failOn: 'error',
        limitInputPixels: IMAGE_THUMBNAIL_MAX_PIXELS,
        pages: 1,
      })
        .rotate()
        .flatten({ background: '#ffffff' })
        .resize({
          width: IMAGE_THUMBNAIL_LONG_EDGE,
          height: IMAGE_THUMBNAIL_LONG_EDGE,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: IMAGE_THUMBNAIL_JPEG_QUALITY })
        .toBuffer();

      return new FileContents(async function* jpeg() {
        yield output;
      });
    } catch (error) {
      throw new ImageThumbnailRejected(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export { SharpImageThumbnailRenderer };
