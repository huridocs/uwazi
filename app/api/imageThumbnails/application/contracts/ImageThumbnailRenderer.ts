import { FileContents } from '#api/core/domain/files/FileContents.js';

interface ImageThumbnailRenderer {
  render(content: FileContents): Promise<FileContents>;
}

export type { ImageThumbnailRenderer };
