/* eslint-disable import/no-default-export */
import { Db } from 'mongodb';

const FILTER = {
  type: 'attachment',
  url: { $exists: true, $ne: null },
  $or: [
    { filename: { $exists: false } },
    { filename: null },
    { filename: '' },
    { originalname: { $exists: false } },
    { originalname: null },
    { originalname: '' },
  ],
};

/**
 * Backfill missing filename/originalname for legacy URL attachments.
 *
 * Old URL attachments (type = 'attachment' with a url) may lack filename or
 * originalname because there is no actual file on disk. The V2 URLAttachment
 * domain model already falls back to the url for both fields. This migration
 * applies the same rule to existing MongoDB documents so the Postgres migration
 * can read them without inventing synthetic values.
 */
export default {
  delta: 199,

  name: 'set-filename-for-url-attachments',

  description:
    'Sets filename and originalname to url for legacy URL attachments that are missing them.',

  reindex: false,

  requiresSchema: 5,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const result = await db.collection('files').updateMany(FILTER, [
      {
        $set: {
          filename: {
            $cond: [
              {
                $or: [
                  { $eq: [{ $ifNull: ['$filename', null] }, null] },
                  { $eq: ['$filename', ''] },
                ],
              },
              '$url',
              '$filename',
            ],
          },
          originalname: {
            $cond: [
              {
                $or: [
                  { $eq: [{ $ifNull: ['$originalname', null] }, null] },
                  { $eq: ['$originalname', ''] },
                ],
              },
              '$url',
              '$originalname',
            ],
          },
        },
      },
    ]);

    process.stdout.write(
      `${this.name}: matched ${result.matchedCount} file(s), modified ${result.modifiedCount}.\r\n`
    );
  },
};
