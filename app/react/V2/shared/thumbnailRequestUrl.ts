const THUMBNAIL_EXTENSIONS = new Set([
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

const extensionOf = (filename: string): string => {
  const dot = filename.lastIndexOf('.');
  if (dot <= 0) {
    return '';
  }
  return filename.slice(dot + 1).toLowerCase();
};

/** Card and compact image requests. Audio, video, and other files stay on /api/files/. */
const thumbnailRequestUrl = (src: string): string => {
  const match = src.match(/^\/api\/files\/([^?#]+)/);
  if (!match || !THUMBNAIL_EXTENSIONS.has(extensionOf(match[1]))) {
    return src;
  }
  return src.replace(/^\/api\/files\//, '/files/thumbnails/');
};

export { thumbnailRequestUrl };
