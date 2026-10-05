import { AnyBulkWriteOperation, Collection, Db, ObjectId } from 'mongodb';
import { FileDoc, OcrRecordDoc } from './types.js';

const COLLECTION = 'ocr_records';
const BATCH_SIZE = 500;

/** What the old pipeline stored, mapped to the statuses of the queue-driven one. */
const STATUS_MAP: Record<string, string> = {
  inQueue: 'processing',
  processing: 'processing',
  withOCR: 'ready',
  cannotProcess: 'failed',
};

const FINISHED = ['withOCR', 'ready'];

type Duplicates = { _id: ObjectId; members: { id: ObjectId; status?: string }[] };

/** The newest of the documents, by id: a later ObjectId was created later. */
const newest = (members: Duplicates['members']) =>
  [...members].sort((a, b) => b.id.toHexString().localeCompare(a.id.toHexString()))[0];

/** A file's finished record when it has one, otherwise its most recent. */
const keeperOf = (members: Duplicates['members']) =>
  newest(members.filter(member => FINISHED.includes(member.status ?? ''))) ?? newest(members);

const collectionExists = async (db: Db) =>
  (await db.listCollections({ name: COLLECTION }).toArray()).length > 0;

const deleteUnusable = async (records: Collection<OcrRecordDoc>) =>
  records.deleteMany({
    sourceFile: { $in: [null] },
    resultFile: { $in: [null] },
  });

const deduplicate = async (records: Collection<OcrRecordDoc>) => {
  const groups = await records
    .aggregate<Duplicates>([
      { $match: { sourceFile: { $type: 'objectId' } } },
      { $group: { _id: '$sourceFile', members: { $push: { id: '$_id', status: '$status' } } } },
      { $match: { 'members.1': { $exists: true } } },
    ])
    .toArray();

  const discarded = groups.flatMap(({ members }) => {
    const keeper = keeperOf(members);
    return members.filter(member => !member.id.equals(keeper.id)).map(member => member.id);
  });

  if (discarded.length) {
    await records.deleteMany({ _id: { $in: discarded } });
  }
};

const filesById = async (db: Db, batch: OcrRecordDoc[]) => {
  const ids = batch.flatMap(record => [record.sourceFile, record.resultFile]).filter(Boolean);
  const found = await db
    .collection<FileDoc>('files')
    .find({ _id: { $in: ids as ObjectId[] } }, { projection: { filename: 1 } })
    .toArray();
  return new Map(found.map(file => [file._id.toHexString(), file]));
};

/** The operation normalizing one record, or deleting it when nothing usable is left of it. */
const normalize = (
  record: OcrRecordDoc,
  files: Map<string, FileDoc>
): AnyBulkWriteOperation<OcrRecordDoc> => {
  const drop = { deleteOne: { filter: { _id: record._id } } };
  const status = STATUS_MAP[record.status ?? ''];
  if (!status) {
    return drop;
  }

  const source = record.sourceFile ? files.get(record.sourceFile.toHexString()) : undefined;
  const result = record.resultFile ? files.get(record.resultFile.toHexString()) : undefined;
  if (!source && status !== 'ready') {
    return drop;
  }

  const lastUpdated = record.lastUpdated ?? record._id.getTimestamp().getTime();
  return {
    updateOne: {
      filter: { _id: record._id },
      update: {
        $set: {
          sourceFile: source ? record.sourceFile! : null,
          filename: source?.filename ?? result?.filename ?? '',
          language: record.language ?? 'other',
          status,
          attempt: 0,
          lastUpdated,
          ...(status === 'processing' && { requestedAt: lastUpdated }),
          ...(status === 'failed' && { failureReason: 'unexpected' }),
        },
        $unset: { sessionId: '' },
      },
    },
  };
};

/**
 * Records the old pipeline wrote carry no attempt; the ones the new pipeline writes always do, and
 * are left alone.
 */
const normalizeLegacy = async (db: Db, records: Collection<OcrRecordDoc>) => {
  const cursor = records.find({ attempt: { $exists: false } });
  let batch: OcrRecordDoc[] = [];

  const flush = async () => {
    if (!batch.length) {
      return;
    }
    const files = await filesById(db, batch);
    await records.bulkWrite(batch.map(record => normalize(record, files)));
    batch = [];
  };

  // eslint-disable-next-line no-await-in-loop
  for await (const record of cursor) {
    batch.push(record);
    if (batch.length >= BATCH_SIZE) {
      await flush();
    }
  }
  await flush();
};

const createIndexes = async (records: Collection<OcrRecordDoc>) => {
  await records.createIndex(
    { sourceFile: 1 },
    { unique: true, partialFilterExpression: { sourceFile: { $type: 'objectId' } } }
  );
};

export default {
  delta: 213,

  name: 'normalize-ocr-records',

  description:
    'Normalizes legacy ocr_records for the queue-driven pipeline: one per source file, new statuses, attempt, filename and request time',

  reindex: false,

  requiresSchema: 0,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    if (!(await collectionExists(db))) {
      return;
    }

    const records = db.collection<OcrRecordDoc>(COLLECTION);
    await deleteUnusable(records);
    await deduplicate(records);
    await normalizeLegacy(db, records);
    await createIndexes(records);
  },
};
