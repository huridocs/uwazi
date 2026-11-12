import { FileContents } from '#api/core/domain/files/FileContents.js';
import { ResultType } from '#api/core/libs/Result.js';
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

type ThumbnailFileIO = {
  toBuffer(file: FileContents): Promise<ResultType<Buffer, Error>>;
};

type HttpThumbnailClient = {
  baseUrl: string;
  fileIO: ThumbnailFileIO;
  fetchImpl?: typeof fetch;
};

const asError = (error: unknown) => (error instanceof Error ? error : new Error(String(error)));

const jpegContents = (payload: ArrayBuffer) => {
  const bytes = Buffer.from(payload);
  return new FileContents(async function* body() {
    yield bytes;
  });
};

const fromResponse = async (response: Response) => {
  if (response.status === 200) {
    return jpegContents(await response.arrayBuffer());
  }
  const detail = new Error(
    (await response.text()) || `thumbnail service returned ${response.status}`
  );
  if (response.status === 422) {
    throw new ImageThumbnailRejected(detail);
  }
  throw new ImageThumbnailUnavailable(detail);
};

const endpointFor = (baseUrl: string) => {
  const root = baseUrl.replace(/\/$/, '');
  const query = new URLSearchParams({
    edge: String(IMAGE_THUMBNAIL_LONG_EDGE),
    quality: String(IMAGE_THUMBNAIL_JPEG_QUALITY),
    maxPixels: String(IMAGE_THUMBNAIL_MAX_PIXELS),
  });
  return `${root}/thumbnails?${query}`;
};

class HttpImageThumbnailRenderer implements ImageThumbnailRenderer {
  constructor(private client: HttpThumbnailClient) {}

  async render(content: FileContents): Promise<FileContents> {
    const body = await this.bytes(content);
    const response = await this.post(body);
    return fromResponse(response);
  }

  private async bytes(content: FileContents) {
    const buffered = await this.client.fileIO.toBuffer(content);
    if (buffered.isError()) {
      throw new ImageThumbnailUnavailable(buffered.getError() ?? new Error('unreadable file'));
    }
    return buffered.getDataOrThrow();
  }

  private async post(body: Buffer) {
    const fetchImpl = this.client.fetchImpl ?? fetch;
    try {
      return await fetchImpl(endpointFor(this.client.baseUrl), {
        method: 'POST',
        body: new Uint8Array(body),
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    } catch (error) {
      throw new ImageThumbnailUnavailable(asError(error));
    }
  }
}

export type { HttpThumbnailClient };
export { HttpImageThumbnailRenderer };
