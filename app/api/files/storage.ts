// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { access, readFile } from 'fs/promises';
import { attachmentsPath, customUploadsPath, uploadsPath } from './filesystem';

type FileTypes = 'custom' | 'document' | 'thumbnail' | 'attachment';

const paths: { [k in FileTypes]: (filename: string) => string } = {
  custom: customUploadsPath,
  document: uploadsPath,
  thumbnail: uploadsPath,
  attachment: attachmentsPath,
};

export const readableFile = async (filename: string, type: FileTypes) => {
  return createReadStream(uploadsPath(filename));
};

export const fileContents = async (filename: string, type: FileTypes) => {
  return readFile(uploadsPath(filename));
};

export const fileExists = async (filename: string, type: FileTypes): Promise<boolean> => {
  try {
    await access(paths[type](filename));
  } catch (err) {
    if (err?.code === 'ENOENT') {
      return false;
    }
    if (err) {
      throw err;
    }
  }
  return true;
};
