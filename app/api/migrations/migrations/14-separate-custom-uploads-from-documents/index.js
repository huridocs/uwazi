/* eslint-disable no-await-in-loop */
import path from 'path';
import fs from '../../../utils/async-fs';
import paths from '../../../config/paths';

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

      const oldPath = path.join(paths.uploadedDocuments, filename);
      const newPath = path.join(paths.customUploads, filename);
      try {
        await fs.rename(oldPath, newPath);
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
