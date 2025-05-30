import { Db } from 'mongodb';

import { getMimeTypeFromOriginalName } from './fileUtils';
import { ArrayUtils } from './arrayUtils';

export default {
  delta: 172,

  name: 'files_detect_and_assign_mimetype',

  description: 'This migration will detect and assign the MIME-type for files without it.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    const filesCollection = db.collection('files');

    const files = await filesCollection
      .find(
        {
          $or: [{ mimetype: { $exists: false } }, { mimetype: null }, { mimetype: '' }],
          originalname: { $exists: true },
        },
        { projection: { _id: 1, originalname: 1 } }
      )
      .toArray();

    await ArrayUtils.sequentialFor(files, async file => {
      await filesCollection.updateOne(
        { _id: file._id },
        {
          $set: {
            mimetype: getMimeTypeFromOriginalName(file.originalname) || 'application/octet-stream',
          },
        }
      );
    });
  },
};
