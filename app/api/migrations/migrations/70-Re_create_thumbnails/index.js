import path from 'path';
import { config } from 'api/config';
import { spawn } from 'child-process-promise';

async function createThumbnail(filePath, thumbnailName) {
  await spawn(
    'pdftoppm',
    [
      '-f',
      '1',
      '-singlefile',
      '-scale-to',
      '320',
      '-jpeg',
      filePath,
      path.join(path.dirname(filePath), thumbnailName),
    ],
    { capture: ['stdout', 'stderr'] }
  );
}

/* eslint-disable no-await-in-loop */
export default {
  delta: 70,

  name: 'Re-create thumbnails',

  description: 'Fixes previous migration results by recreating the thumbnails for the documents',

  reindex: false,

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = await db.collection('files').find({ type: 'document' });
    while (await cursor.hasNext()) {
      const file = await cursor.next();

      const [thumbnail] = await db
        .collection('files')
        .find({ type: 'thumbnail', filename: `${file._id.toString()}.jpg` })
        .toArray();

      if (!thumbnail) {
        const pdfPath = path.join(config.defaultTenant.uploadedDocuments, file.filename);

        await createThumbnail(pdfPath, file._id.toString());
        await db.collection('files').insertOne({
          type: 'thumbnail',
          entity: file.entity,
          language: file.language,
          filename: `${file._id.toString()}.jpg`,
        });
      }
    }
  },
};
