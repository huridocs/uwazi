import { Db, ObjectId } from 'mongodb';
import { FileDoc, SegmentationDoc } from './types.js';

const BATCH_SIZE = 500;

const PDF_DOCUMENTS = {
  type: 'document' as const,
  mimetype: 'application/pdf',
  filename: { $type: 'string' as const, $ne: '' },
};

/** The PDF documents after `afterId`, one batch, in id order. */
const nextBatch = async (db: Db, afterId?: ObjectId) =>
  db
    .collection<FileDoc>('files')
    .find(
      { ...PDF_DOCUMENTS, ...(afterId && { _id: { $gt: afterId } }) },
      { projection: { _id: 1, filename: 1 } }
    )
    .sort({ _id: 1 })
    .limit(BATCH_SIZE)
    .toArray();

const registerMissing = async (db: Db, files: FileDoc[]) => {
  const segmentations = db.collection<SegmentationDoc>('segmentations');
  const registered = new Set(
    (
      await segmentations
        .find({ fileID: { $in: files.map(file => file._id) } }, { projection: { fileID: 1 } })
        .toArray()
    ).map(segmentation => segmentation.fileID.toHexString())
  );

  const missing = files.filter(file => !registered.has(file._id.toHexString()));
  if (missing.length) {
    await segmentations.insertMany(
      missing.map(file => ({
        _id: new ObjectId(),
        fileID: file._id,
        filename: file.filename!,
        status: 'idle',
        attempt: 0,
      }))
    );
  }
};

const registerFrom = async (db: Db, afterId?: ObjectId): Promise<void> => {
  const files = await nextBatch(db, afterId);
  if (!files.length) {
    return;
  }
  await registerMissing(db, files);
  await registerFrom(db, files[files.length - 1]._id);
};

/**
 * Registers every PDF document that has no segmentation, idle: the new pipeline registers files
 * as they are created, and nothing scans for older ones any more. Idle segmentations are
 * requested when segmentation is switched on, or with `uwazi segmentation queue-idle` for a
 * tenant that already has it.
 */
export default {
  delta: 212,

  name: 'backfill-segmentations',

  description: 'Registers an idle segmentation for every PDF document that has none',

  reindex: false,

  requiresSchema: 0,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);
    await registerFrom(db);
  },
};
