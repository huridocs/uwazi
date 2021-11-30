/* eslint-disable no-await-in-loop */
//eslint-disable-next-line node/no-restricted-import
import fs from 'fs';
import path from 'path';
import util from 'util';
import { config } from 'api/config';

const rename = util.promisify(fs.rename);

export default {
  delta: 14,

  name: 'separate-custom-uploads-from-documents',

  description: 'Moves custom uploads to their own separate folder from uploaded documents',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const uploads = await db.collection('uploads').find();
    let index = 1;
    while (await uploads.hasNext()) {
      const { filename } = await uploads.next();

      const oldPath = path.join(config.defaultTenant.uploadedDocuments, filename);
      const newPath = path.join(config.defaultTenant.customUploads, filename);
      try {
        await rename(oldPath, newPath);
      } catch (e) {
        if (e.code !== 'ENOENT') {
          throw e;
        }
      }

      process.stdout.write(`processed -> ${index}\r`);
      index += 1;
    }

    process.stdout.write('\r\n');
  },
};
