import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';

const mimeSubtypeLabel = (mimetype?: string, filename?: string) => {
  const mime = mimetype || (filename ? getMimetypeFromUrl(filename) : '');
  if (!mime) return '';
  return (mime.split('/').pop() || mime).toUpperCase();
};

const mimeCategoryLabel = (mimetype?: string) => {
  if (mimetype?.startsWith('video/')) return 'Video';
  if (mimetype?.startsWith('audio/')) return 'Audio';
  if (mimetype?.startsWith('image/')) return 'Image';
  return 'Document';
};

export { mimeSubtypeLabel, mimeCategoryLabel };
