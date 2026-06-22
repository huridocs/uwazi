/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

const OBJECT_ID_HEX_REGEX = '^[a-fA-F0-9]{24}$';

export default {
  delta: 196,

  name: 'normalize-ixsuggestions-fileId-to-objectid',

  description: 'Normalizes ixsuggestions.fileId to ObjectId when stored as a 24-char hex string.',

  reindex: false,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const result = await db
      .collection('ixsuggestions')
      .updateMany({ fileId: { $type: 'string' } }, [
        {
          $set: {
            fileId: {
              $cond: [
                { $regexMatch: { input: '$fileId', regex: OBJECT_ID_HEX_REGEX } },
                { $toObjectId: '$fileId' },
                '$fileId',
              ],
            },
          },
        },
      ]);

    process.stdout.write(
      `${this.name}: scanned ${result.matchedCount} suggestion(s), modified ${result.modifiedCount}.\r\n`
    );
  },
};
