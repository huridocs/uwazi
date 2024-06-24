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

const validEmailFormat = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export { formatBytes, getFileNameAndExtension, validEmailFormat };
