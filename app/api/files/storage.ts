// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { access, readFile } from 'fs/promises';
import { attachmentsPath, customUploadsPath, uploadsPath } from './filesystem';
import { FileType } from 'shared/types/fileType';

type FileTypes = NonNullable<FileType['type']>;

const paths: { [k in FileTypes]: (filename: string) => string } = {
  custom: customUploadsPath,
  document: uploadsPath,
  thumbnail: uploadsPath,
  attachment: attachmentsPath,
};

export const readableFile = async (filename: string, type: FileTypes) => {
  return createReadStream(paths[type](filename));
};

export const fileContents = async (filename: string, type: FileTypes) => {
  return readFile(paths[type](filename));
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
