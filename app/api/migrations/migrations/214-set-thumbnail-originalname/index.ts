/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

/**
 * Thumbnails written by the removed V1 paths stored no originalname.
 * Every other thumbnail stores originalname === filename, which is the value
 * the Postgres files copy uses when the field is missing.
 */
const THUMBNAILS_MISSING_ORIGINALNAME = {
  type: 'thumbnail',
  filename: { $type: 'string', $ne: '' },
  $or: [{ originalname: { $exists: false } }, { originalname: null }, { originalname: '' }],
};

export default {
  delta: 214,

  name: 'set-thumbnail-originalname',

  description: 'Sets originalname to filename on thumbnails that are missing it',

  reindex: false,

  requiresSchema: 0,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const result = await db
      .collection('files')
      .updateMany(THUMBNAILS_MISSING_ORIGINALNAME, [{ $set: { originalname: '$filename' } }]);

    process.stdout.write(
      `${this.name}: matched ${result.matchedCount} file(s), modified ${result.modifiedCount}.\r\n`
    );
  },
};
