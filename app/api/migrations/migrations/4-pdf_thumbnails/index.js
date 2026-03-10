/* eslint-disable no-await-in-loop */
import path from 'path';
import { spawn } from 'child-process-promise';
import { config } from 'api/config';

export default {
  delta: 4,

  name: 'pdf_thumbnails',

  description: 'Creating PDF thubmnails for all documents',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);
    let index = 1;
    const cursor = db.collection('entities').find({ type: 'document' });
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      if (doc.file && doc.file.filename) {
        const documentId = doc._id.toString();
        const filePath = path.join(config.defaultTenant.uploadedDocuments, doc.file.filename);
        const thumbnailPath = path.join(config.defaultTenant.uploadedDocuments, documentId);
        try {
          await spawn(
            'pdftoppm',
            ['-f', '1', '-singlefile', '-scale-to', '320', '-jpeg', filePath, thumbnailPath],
            { capture: ['stdout', 'stderr'] }
          );
        } catch (err) {
          process.stdout.write(`Thumbnail creation error for: ${documentId}\r`);
        }
        process.stdout.write(`processed -> ${index}\r`);
        index += 1;
      }
    }
    process.stdout.write('\r\n');
  },
};
