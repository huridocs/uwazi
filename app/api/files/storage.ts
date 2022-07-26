// eslint-disable-next-line node/no-restricted-import
import { createReadStream } from 'fs';
import { readFile } from 'fs/promises';
import { uploadsPath } from './filesystem';

type FileTypes = 'custom' | 'document' | 'thumbnail' | 'attachment';

export const readableFile = async (filename: string, type: FileTypes) => {
  return createReadStream(uploadsPath(filename));
};

export const fileContents = async (filename: string, type: FileTypes) => {
  return readFile(uploadsPath(filename));
};
