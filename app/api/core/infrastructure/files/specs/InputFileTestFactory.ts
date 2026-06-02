/* eslint-disable node/no-restricted-import */
import * as fs from 'fs/promises';
import path from 'path';
import { InputFile } from '#api/core/infrastructure/files/InputFile.js';

type CreateInputFileOptions = {
  dir: string;
  filename: string;
  contents: string | Buffer;
  fieldname?: string;
  originalname?: string;
  mimetype: string;
};

export const createUploadedInputFile = async ({
  dir,
  filename,
  contents,
  fieldname = 'file',
  originalname,
  mimetype,
}: CreateInputFileOptions) => {
  await fs.mkdir(dir, { recursive: true });
  const full = path.join(dir, filename);
  const data = typeof contents === 'string' ? contents : (contents as any);
  await fs.writeFile(full, data);
  const size =
    typeof contents === 'string'
      ? Buffer.byteLength(contents, 'utf8')
      : (contents as Buffer).length;

  return new InputFile({
    fieldname,
    originalname: originalname || filename,
    encoding: '7bit',
    mimetype,
    destination: dir,
    filename,
    path: full,
    size,
  });
};
