/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-default-export */
import { AnyBulkWriteOperation, Db } from 'mongodb';
import { FileDocument } from './types';
import { createFileSizeResolver, getTenantSnapshot } from './storage';

const BATCH_SIZE = 500;

export default {
  delta: 182,

  reindex: false,

  name: 'fix-missing-fields-on-files',

  description: 'Fixes missing fields on files',

  // eslint-disable-next-line max-statements
  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const tenant = await getTenantSnapshot(db);
    const fileSizeResolver = createFileSizeResolver(tenant);

    const cursor = db.collection<FileDocument>('files').find({
      $or: [
        { creationDate: { $exists: false } },
        { creationDate: null },
        { creationDate: 0 },
        { size: { $exists: false } },
        { size: null },
        { size: 0 },
      ],
    });

    let updatedFiles = 0;
    let batch: AnyBulkWriteOperation<FileDocument>[] = [];

    const flushBatch = async () => {
      if (!batch.length) return;
      await db.collection<FileDocument>('files').bulkWrite(batch, { ordered: false });
      updatedFiles += batch.length;
      batch = [];
    };

    while (await cursor.hasNext()) {
      const file = await cursor.next();
      // eslint-disable-next-line no-continue
      if (!file?._id) continue;

      const updateSet: { creationDate?: number; size?: number } = {};

      if (!file.creationDate) {
        updateSet.creationDate = file._id.getTimestamp().getTime();
      }

      if (!file.size) {
        const size = await fileSizeResolver.getFileSize(file);
        updateSet.size = size ?? 0;
      }

      if (Object.keys(updateSet).length) {
        batch.push({ updateOne: { filter: { _id: file._id }, update: { $set: updateSet } } });
      }

      if (batch.length >= BATCH_SIZE) {
        await flushBatch();
      }
    }

    await flushBatch();

    fileSizeResolver.close();

    process.stdout.write(
      `Missing fields on files fixed successfully. Updated ${updatedFiles} files.\r\n`
    );
  },
};
