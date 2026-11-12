/* eslint-disable max-statements */
import { FileContents } from '#api/core/domain/files/FileContents.js';
import { Result } from '#api/core/libs/Result.js';
import {
  IMAGE_THUMBNAIL_JPEG_QUALITY,
  IMAGE_THUMBNAIL_LONG_EDGE,
  IMAGE_THUMBNAIL_MAX_PIXELS,
} from '../../../domain/imageThumbnail.js';
import {
  ImageThumbnailRejected,
  ImageThumbnailUnavailable,
} from '../../../domain/imageThumbnailErrors.js';
import { HttpImageThumbnailRenderer } from '../HttpImageThumbnailRenderer.js';

const source = () =>
  new FileContents(async function* png() {
    yield Buffer.from('png-bytes');
  });

const endpoint = `http://thumb.example:6020/thumbnails?edge=${IMAGE_THUMBNAIL_LONG_EDGE}&quality=${IMAGE_THUMBNAIL_JPEG_QUALITY}&maxPixels=${IMAGE_THUMBNAIL_MAX_PIXELS}`;

const renderer = (fetchImpl: jest.Mock) =>
  new HttpImageThumbnailRenderer({
    baseUrl: 'http://thumb.example:6020/',
    fileIO: { toBuffer: async () => Result.ok(Buffer.from('png-bytes')) },
    fetchImpl,
  });

const bytesOf = async (content: FileContents) => {
  const chunks: Uint8Array[] = [];
  for await (const chunk of content.read()) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

describe('HttpImageThumbnailRenderer', () => {
  it('posts the file to the thumbnail service and returns the jpeg', async () => {
    const fetchImpl = jest.fn(async () => ({
      status: 200,
      arrayBuffer: async () => Uint8Array.from([0xff, 0xd8, 0x01]),
      text: async () => '',
    }));

    const jpeg = await renderer(fetchImpl).render(source());

    expect(fetchImpl).toHaveBeenCalledWith(endpoint, {
      method: 'POST',
      body: Uint8Array.from(Buffer.from('png-bytes')),
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    expect(await bytesOf(jpeg)).toEqual(Buffer.from([0xff, 0xd8, 0x01]));
  });

  it('rejects a file the service cannot decode', async () => {
    const fetchImpl = jest.fn(async () => ({
      status: 422,
      arrayBuffer: async () => new ArrayBuffer(0),
      text: async () => 'decoder rejected the image',
    }));

    await expect(renderer(fetchImpl).render(source())).rejects.toBeInstanceOf(
      ImageThumbnailRejected
    );
  });

  it('retries when the service is unavailable', async () => {
    const down = jest.fn(async () => ({
      status: 503,
      arrayBuffer: async () => new ArrayBuffer(0),
      text: async () => 'busy',
    }));
    const unreachable = jest.fn(async () => {
      throw new Error('connect ECONNREFUSED');
    });

    await expect(renderer(down).render(source())).rejects.toBeInstanceOf(ImageThumbnailUnavailable);
    await expect(renderer(unreachable).render(source())).rejects.toBeInstanceOf(
      ImageThumbnailUnavailable
    );
  });
});
