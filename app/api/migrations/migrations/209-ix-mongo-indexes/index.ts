import { Db } from 'mongodb';

/**
 * `IXSuggestionsModel` and `IXExtractorModel` declared these indexes on their mongoose schemas,
 * and mongoose recreated them on every startup. Both models are gone, so without this the indexes
 * silently stop existing on any database created from here on — and nothing fails, the settings
 * table and the per-run lookups just degrade into collection scans.
 *
 * Existing databases already have them; `createIndex` on an index that matches is a no-op.
 */
const suggestionsIndexes = [
  { extractorId: 1, 'state.labeled': 1, 'state.match': 1 },
  { extractorId: 1, 'state.labeled': 1, 'state.withSuggestion': 1 },
  { extractorId: 1, 'state.labeled': 1, 'state.hasContext': 1 },
  { extractorId: 1, 'state.labeled': 1, 'state.obsolete': 1 },
  { extractorId: 1, 'state.labeled': 1, 'state.error': 1 },
  { extractorId: 1, useForTraining: 1 },
  { extractorId: 1, date: 1, state: -1 },
  // per-run lookups: previous run filters and seen-in-run checks
  { extractorId: 1, 'modelData.suggestionsRunTimestamp': 1, status: 1, entityId: 1 },
];

const extractorsIndexes = [
  { property: 1, templates: 1 },
  { templates: 1, property: 1 },
];

export default {
  delta: 209,

  name: 'ix-mongo-indexes',

  description:
    'recreate the ixsuggestions and ixextractors indexes the retired mongoose models declared',

  reindex: false,

  requiresSchema: 17,

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    await Promise.all(
      suggestionsIndexes.map(async index =>
        db.collection('ixsuggestions').createIndex(index as any, { background: true })
      )
    );

    await Promise.all(
      extractorsIndexes.map(async index =>
        db.collection('ixextractors').createIndex(index as any, { background: true })
      )
    );
  },
};
