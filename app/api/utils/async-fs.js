import { promisify } from 'util';
import fs from 'fs';

export default {
  writeFile: promisify(fs.writeFile),
  exists: promisify(fs.exists),
  unlink: promisify(fs.unlink),
};
