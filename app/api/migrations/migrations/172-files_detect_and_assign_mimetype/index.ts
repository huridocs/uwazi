/* eslint-disable no-await-in-loop */
import { Db } from 'mongodb';
import { getMimeTypeFromOriginalName } from './fileUtils';

export default {
  delta: 172,

  name: 'files_detect_and_assign_mimetype',

  description: 'This migration will detect and assign the mimetype for files without it.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const files = await db
      .collection('files')
      .find({}, { projection: { _id: 1, originalname: 1, filename: 1 } })
      .toArray();

    const filesWithMimetype = files.map(file => ({
      ...file,
      mimetype: getMimeTypeFromOriginalName(file.originalname) || 'application/octet-stream',
    }));
  },
};
