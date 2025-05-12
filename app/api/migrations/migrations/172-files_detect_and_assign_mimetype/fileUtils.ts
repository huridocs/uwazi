import mimetypes from 'mime-types';

import { FileType } from './types';

const ID = () => Math.random().toString(36).substr(2);

const getMimeTypeFromOriginalName = (originalname: string) => mimetypes.lookup(originalname);

const getExtension = (mimetype = '') => {
  const result = mimetypes.extension(mimetype);

  return result === 'jpeg' ? 'jpg' : result;
};

const generateFileName = ({ mimetype = '', originalname = '' }: FileType) => {
  const fileName = `${Date.now()}${ID()}`;

  const extensionFromOriginalName = getExtension(getMimeTypeFromOriginalName(originalname) || '');
  if (extensionFromOriginalName) return `${fileName}.${extensionFromOriginalName}`;

  const extensionFromMime = getExtension(mimetype);
  if (extensionFromMime) return `${fileName}.${extensionFromMime}`;

  return fileName;
};

export { generateFileName, getMimeTypeFromOriginalName };
