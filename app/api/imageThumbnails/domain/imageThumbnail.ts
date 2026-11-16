const IMAGE_THUMBNAIL_LONG_EDGE = 640;

const IMAGE_THUMBNAIL_JPEG_QUALITY = 60;

/** Sharp's own input ceiling. One place to lower it if a tenant needs a tighter limit. */
const IMAGE_THUMBNAIL_MAX_PIXELS = 268_402_689;

const IMAGE_THUMBNAIL_DIRECTORY = `thumbnails/${IMAGE_THUMBNAIL_LONG_EDGE}`;

const IMAGE_THUMBNAIL_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'jpe',
  'jfif',
  'png',
  'webp',
  'gif',
  'bmp',
  'avif',
  'heic',
  'heif',
  'tif',
  'tiff',
]);

type ImageThumbnailLocation = {
  type: 'customPath';
  destination: string;
  filename: string;
};

const extensionOf = (filename: string): string => {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) {
    return '';
  }
  return filename.slice(dot + 1).toLowerCase();
};

const imageNeedsThumbnail = (filename: string): boolean =>
  IMAGE_THUMBNAIL_EXTENSIONS.has(extensionOf(filename));

const imageThumbnailLocation = (filename: string): ImageThumbnailLocation => ({
  type: 'customPath',
  destination: IMAGE_THUMBNAIL_DIRECTORY,
  filename,
});

const imageThumbnailSkipLocation = (filename: string): ImageThumbnailLocation => ({
  type: 'customPath',
  destination: IMAGE_THUMBNAIL_DIRECTORY,
  filename: `${filename}.skip`,
});

export {
  IMAGE_THUMBNAIL_DIRECTORY,
  IMAGE_THUMBNAIL_JPEG_QUALITY,
  IMAGE_THUMBNAIL_LONG_EDGE,
  IMAGE_THUMBNAIL_MAX_PIXELS,
  imageNeedsThumbnail,
  imageThumbnailLocation,
  imageThumbnailSkipLocation,
};
export type { ImageThumbnailLocation };
