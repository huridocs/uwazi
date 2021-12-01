//eslint-disable-next-line node/no-restricted-import
import fs from 'fs';

const { createWriteStream, createReadStream } = fs;

const uwaziFS = {
  ...fs.promises,
  createWriteStream,
  createReadStream,
};

export { uwaziFS };
