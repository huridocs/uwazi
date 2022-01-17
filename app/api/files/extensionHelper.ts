import mimetypes from 'mime-types';

export const mimeTypeFromUrl = (url: string) => {
  const acceptedMimeTypes = ['image', 'audio', 'text', 'video'];
  const extension = url?.split(/[#?]/)[0].split('.').pop()?.trim();

  if (extension) {
    const mimetype = mimetypes.lookup(extension) || 'text/html';
    if (acceptedMimeTypes.includes(mimetype.split('/')[0])) {
      return mimetype;
    }
  }

  return 'text/html';
};
