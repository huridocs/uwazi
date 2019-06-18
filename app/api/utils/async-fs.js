import { promisify } from 'util';
import fs from 'fs';

export default {
  writeFile: promisify(fs.writeFile),
  exists: promisify(fs.exists),
  unlink: promisify(fs.unlink),
  rename: promisify(fs.rename),
  readFile: promisify(fs.readFile),
  readdir: promisify(fs.readdir),
};
