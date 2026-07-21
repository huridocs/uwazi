type FileLike = Pick<File, 'type' | 'name'>;

const isPdfFile = (file: FileLike) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const fileSupportsLanguage = (file: FileLike) => {
  const mime = file.type;

  if (mime.startsWith('image/') || mime.startsWith('audio/') || mime.startsWith('video/')) {
    return false;
  }

  if (
    mime === 'application/pdf' ||
    mime.startsWith('text/') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('presentation') ||
    mime.includes('spreadsheet')
  ) {
    return true;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf'].includes(extension ?? '');
};

export { isPdfFile, fileSupportsLanguage };
