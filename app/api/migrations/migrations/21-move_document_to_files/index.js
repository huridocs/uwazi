/* eslint-disable no-await-in-loop, max-statements, node/no-restricted-import */
import fs from 'fs';
import path from 'path';

import { config } from 'api/config';

const rename = async (current, newPath) =>
  new Promise((resolve, reject) => {
    fs.rename(current, newPath, err => {
      if (err === null) {
        resolve(true);
      }
      if (err) {
        reject(err);
      }
    });
  });

export const fileExists = async filePath =>
  new Promise((resolve, reject) => {
    fs.stat(filePath, err => {
      if (err === null) {
        resolve(true);
      }
      if (err && err.code === 'ENOENT') {
        resolve(false);
      }
      if (err) {
        reject(err);
      }
    });
  });

const oldThumbnailExists = async entity =>
  fileExists(path.join(config.defaultTenant.uploadedDocuments, `${entity._id}.jpg`));

export default {
  delta: 21,

  name: 'move_document_to_files',

  description: 'move document from the entity to the files collection',

  async up(db) {
    process.stdout.write(`${this.name}...\r\n`);

    const cursor = db.collection('entities').find({});

    let index = 1;

    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      if (entity.file) {
        const { file, uploaded, toc, fullText, processed, totalPages, pdfInfo, ...newEntity } =
          entity;

        const fileToCreate = {
          type: 'document',
          toc,
          fullText,
          status: processed ? 'ready' : 'failed',
          uploaded,
          totalPages,
          pdfInfo,
          entity: entity.sharedId,
          ...file,
        };

        const [alreadyExists] = await db
          .collection('files')
          .find({ entity: entity.sharedId, filename: entity.file.filename })
          .toArray();

        if (!alreadyExists) {
          // console.log(await db.collection('files').insertOne(fileToCreate));
          const { insertedId } = await db.collection('files').insertOne(fileToCreate);

          db.collection('connections').updateMany(
            { filename: fileToCreate.filename },
            { $set: { file: insertedId.toString() }, $unset: { filename: '' } }
          );

          if (await oldThumbnailExists(entity)) {
            const thumbnailToCreate = {
              filename: `${insertedId}.jpg`,
              type: 'thumbnail',
            };
            await db.collection('files').insertOne(thumbnailToCreate);
            await rename(
              path.join(config.defaultTenant.uploadedDocuments, `${entity._id}.jpg`),
              path.join(config.defaultTenant.uploadedDocuments, thumbnailToCreate.filename)
            );
          }
        }

        await db.collection('entities').replaceOne({ _id: entity._id }, newEntity);

        process.stdout.write(` -> processed: ${index} \r`);
        index += 1;
      }
    }

    process.stdout.write('\r\n');
  },
};
