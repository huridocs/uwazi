import { Collection, Db, ObjectId } from 'mongodb';
import { SegmentationDoc } from './types.js';

const COLLECTION = 'segmentations';

type Duplicates = { _id: ObjectId; members: { id: ObjectId; status?: string }[] };

/** The newest of the documents, by id: a later ObjectId was created later. */
const newest = (members: Duplicates['members']) =>
  [...members].sort((a, b) => b.id.toHexString().localeCompare(a.id.toHexString()))[0];

/** A file's ready segmentation when it has one, otherwise its most recent. */
const keeperOf = (members: Duplicates['members']) =>
  newest(members.filter(member => member.status === 'ready')) ?? newest(members);

const collectionExists = async (db: Db) =>
  (await db.listCollections({ name: COLLECTION }).toArray()).length > 0;

const deleteUnusable = async (segmentations: Collection<SegmentationDoc>) =>
  segmentations.deleteMany({
    $or: [
      { fileID: { $exists: false } },
      { fileID: null },
      { filename: { $exists: false } },
      { filename: null },
      { filename: '' },
    ],
  });

const deduplicate = async (segmentations: Collection<SegmentationDoc>) => {
  const groups = await segmentations
    .aggregate<Duplicates>([
      { $group: { _id: '$fileID', members: { $push: { id: '$_id', status: '$status' } } } },
      { $match: { 'members.1': { $exists: true } } },
    ])
    .toArray();

  const discarded = groups.flatMap(({ members }) => {
    const keeper = keeperOf(members);
    return members.filter(member => !member.id.equals(keeper.id)).map(member => member.id);
  });

  if (discarded.length) {
    await segmentations.deleteMany({ _id: { $in: discarded } });
  }
};

/**
 * The old loop's documents carry no attempt. Its claims, and the failures it would have retried
 * once their TTL reaped them, go back to idle to be requested again; what the service reported
 * failed stays failed. Documents the new pipeline wrote always carry an attempt, and are left
 * alone.
 */
const normalizeLegacy = async (segmentations: Collection<SegmentationDoc>) => {
  const legacy = { attempt: { $exists: false } };
  await segmentations.updateMany({ ...legacy, status: 'processing' }, { $set: { status: 'idle' } });
  await segmentations.updateMany(
    { ...legacy, status: 'failed', autoexpire: { $type: 'date' } },
    { $set: { status: 'idle' } }
  );
  await segmentations.updateMany(legacy, { $set: { attempt: 0 } });
  await segmentations.updateMany({ autoexpire: { $exists: true } }, { $unset: { autoexpire: '' } });
};

const replaceIndexes = async (segmentations: Collection<SegmentationDoc>) => {
  const indexes = await segmentations.indexes();

  await Promise.all(
    indexes
      .filter(
        index =>
          index.key.autoexpire !== undefined ||
          (index.key.fileID && !index.unique && Object.keys(index.key).length === 1)
      )
      .map(async index => segmentations.dropIndex(index.name!))
  );

  await segmentations.createIndex({ fileID: 1 }, { name: 'fileID_unique', unique: true });
  await segmentations.createIndex({ status: 1, _id: 1 }, { name: 'status_id' });
};

export default {
  delta: 211,

  name: 'normalize-segmentations',

  description:
    'Normalizes legacy segmentations for the queue-driven pipeline: one per file, legacy claims and retryable failures back to idle, no TTL',

  reindex: false,

  requiresSchema: 0,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    if (!(await collectionExists(db))) {
      return;
    }

    const segmentations = db.collection<SegmentationDoc>(COLLECTION);
    await deleteUnusable(segmentations);
    await deduplicate(segmentations);
    await normalizeLegacy(segmentations);
    await replaceIndexes(segmentations);
  },
};
