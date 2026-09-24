import { Db } from 'mongodb';
import { PostgresDB } from '#api/infrastructure/PostgresDB.js';

const BATCH_SIZE = 50;

type MongoSessionDocument = {
  _id: unknown;
  session: unknown;
  expires: Date;
};

type HttpSessionRow = {
  sid: string;
  sess: unknown;
  expire: Date;
};

type CopyResult = {
  copied: number;
  alreadyPresent: number;
};

const toRow = (doc: MongoSessionDocument): HttpSessionRow => {
  const sess = typeof doc.session === 'string' ? JSON.parse(doc.session) : doc.session;
  return {
    sid: String(doc._id),
    sess,
    expire: new Date(doc.expires),
  };
};

const insertBatch = async (batch: HttpSessionRow[]): Promise<number> => {
  if (!batch.length) {
    return 0;
  }
  const inserted: { sid: string }[] = await PostgresDB.knex('http_sessions')
    .insert(batch)
    .onConflict('sid')
    .ignore()
    .returning('sid');
  return inserted.length;
};

type CopyTotals = { copied: number; seen: number; batch: HttpSessionRow[] };

const takeDocument = async (state: CopyTotals, doc: MongoSessionDocument): Promise<CopyTotals> => {
  const batch = [...state.batch, toRow(doc)];
  const seen = state.seen + 1;
  if (batch.length < BATCH_SIZE) {
    return { copied: state.copied, seen, batch };
  }
  return { copied: state.copied + (await insertBatch(batch)), seen, batch: [] };
};

/**
 * One pass over the shared Mongo `sessions` collection into `http_sessions`.
 * Rows already stored are left as they are. No tenant column is written.
 */
const copyHttpSessions = async (mongoDb: Db): Promise<CopyResult> => {
  const cursor = mongoDb
    .collection<MongoSessionDocument>('sessions')
    .find({})
    .batchSize(BATCH_SIZE);
  let state: CopyTotals = { copied: 0, seen: 0, batch: [] };

  for await (const doc of cursor) {
    state = await takeDocument(state, doc);
  }

  const copied = state.copied + (await insertBatch(state.batch));
  return { copied, alreadyPresent: state.seen - copied };
};

export { copyHttpSessions };
export type { CopyResult };
