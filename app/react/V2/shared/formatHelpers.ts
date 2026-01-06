const formatBytes = (bytes: number) => {
  //Sourced from https://stackoverflow.com/questions/15900485
  if (!+bytes || +bytes < 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${parseFloat((bytes / 1024 ** index).toFixed(2))} ${sizes[index]}`;
};

const getFileNameAndExtension = (filename?: string) => {
  if (!filename) return { name: '', extension: '' };

  const name = filename.slice(0, filename.lastIndexOf('.'));
  const extension = filename.slice(filename.lastIndexOf('.') + 1);

  return { name, extension };
};

const getMimetypeFromUrl = (url: string): string => {
  const extension = url.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    mp4: 'video/mp4',
    avi: 'video/avi',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    flv: 'video/x-flv',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
  };
  return mimeTypes[extension || ''] || 'application/octet-stream';
};

const validEmailFormat = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds < 0) return 'n/a';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export {
  formatBytes,
  getFileNameAndExtension,
  getMimetypeFromUrl,
  validEmailFormat,
  formatDuration,
};
