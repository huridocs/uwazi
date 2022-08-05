//eslint-disable-next-line node/no-restricted-import
import { createReadStream, createWriteStream } from 'fs';
import fs from 'fs/promises';

const uwaziFS = {
  ...fs,
  createWriteStream,
  createReadStream,
};

export { uwaziFS };
