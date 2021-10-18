export const getFileExtension = (filename: string) =>
  filename ? filename.substr(filename.lastIndexOf('.') + 1) : '';
