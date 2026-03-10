import path from 'path';
import { config } from 'api/config';
import { spawn } from 'child-process-promise';
// eslint-disable-next-line node/no-restricted-import
import fs from 'fs/promises';

async function exists(pdfPath) {
  try {
    await fs.access(pdfPath);
    return true;
  } catch {
    return false;
  }
}

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

/* eslint-disable no-await-in-loop, import/no-default-export */
export default {
  delta: 70,

  name: 'Re-create thumbnails',

  description: 'Fixes previous migration results by recreating the thumbnails for the documents',

  reindex: false,

  // eslint-disable-next-line max-statements
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
        if (await exists(pdfPath)) {
          try {
            await createThumbnail(pdfPath, file._id.toString());
            await db.collection('files').insertOne({
              type: 'thumbnail',
              entity: file.entity,
              language: file.language,
              filename: `${file._id.toString()}.jpg`,
            });
          } catch (e) {
            // eslint-disable-next-line
            console.warn(`ERROR creating thumbnail for: ${pdfPath}`);
            // eslint-disable-next-line
            console.warn(e);
          }
        }
      }
    }
  },
};
