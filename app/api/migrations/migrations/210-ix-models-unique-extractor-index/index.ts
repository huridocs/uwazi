import { Db, ObjectId } from 'mongodb';

/**
 * `ixmodels` carried no index at all — migration 209 covered `ixsuggestions` and `ixextractors`,
 * but the models collection never had one, because its mongoose schema never declared one. Two
 * consequences:
 *
 * 1. Every `getByExtractorId` is a collection scan, and it is the hottest read in IX.
 * 2. `markTraining` upserts on `{ extractorId }`. MongoDB only guarantees an upsert will not
 *    insert a duplicate when the query field carries a **unique** index, so two concurrent
 *    trainings could leave two model rows for one extractor. `getByExtractorId` is a `findOne`
 *    and would then pick one arbitrarily — reintroducing the "loop never terminates" class of
 *    bug this migration's collection has already produced twice.
 *
 * One model row per extractor is the invariant every read and write already assumes, so it is
 * expressed as a constraint here.
 */

/**
 * A unique index refuses to build if duplicates already exist, so any are collapsed first.
 *
 * The newest row wins: duplicates can only come from a race between two upserts, so the later
 * one reflects the training the user actually asked for last.
 */
const collapseDuplicates = async (db: Db) => {
  // A model row with no `extractorId` is unreachable — every read goes through
  // `getByExtractorId` — and more than one of them would collide on the unique index just as
  // duplicates do. Nothing can refer to them, so they go rather than being arbitrarily kept.
  const { deletedCount } = await db
    .collection('ixmodels')
    .deleteMany({ extractorId: { $in: [null, undefined] } });

  if (deletedCount) {
    process.stdout.write(`  removed ${deletedCount} ixmodels row(s) with no extractorId\r\n`);
  }

  const duplicated = await db
    .collection('ixmodels')
    .aggregate<{ _id: ObjectId; ids: ObjectId[] }>([
      { $group: { _id: '$extractorId', ids: { $push: '$_id' } } },
      { $match: { 'ids.1': { $exists: true } } },
    ])
    .toArray();

  const supersededIds = duplicated.flatMap(({ ids }) =>
    [...ids].sort((a, b) => (a.toString() < b.toString() ? -1 : 1)).slice(0, -1)
  );

  if (supersededIds.length) {
    await db.collection('ixmodels').deleteMany({ _id: { $in: supersededIds } });
    process.stdout.write(`  collapsed ${supersededIds.length} duplicate ixmodels row(s)\r\n`);
  }
};

export default {
  delta: 210,

  name: 'ix-models-unique-extractor-index',

  description: 'collapse duplicate ixmodels rows and add the unique extractorId index',

  reindex: false,

  requiresSchema: 17,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    await collapseDuplicates(db);

    await db
      .collection('ixmodels')
      .createIndex({ extractorId: 1 }, { unique: true, background: true });
  },
};
