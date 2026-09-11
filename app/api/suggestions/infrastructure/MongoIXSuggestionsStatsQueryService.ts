import { Db, Document, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ObjectIdSchema } from '#shared/types/commonTypes.js';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import {
  IXSuggestionsStatsQueryService,
  SuggestionStats,
} from '../domain/IXSuggestionsStatsQueryService.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const ixSuggestionsCollection = 'ixsuggestions';

const emptyStats: SuggestionStats = {
  total: 0,
  labeled: 0,
  nonLabeled: 0,
  match: 0,
  mismatch: 0,
  obsolete: 0,
  error: 0,
  noContext: 0,
  nonProcessed: 0,
  accuracy: 0,
};

/** Present and falsy — as opposed to absent, which counts towards neither side of a tally. */
const presentAndFalse = (field: string) => ({
  $and: [{ $ne: [field, undefined] }, { $ne: [field, null] }, { $not: field }],
});

const statsPipeline = (extractorId: ObjectId): Document[] => [
  { $match: { extractorId } },
  {
    // processed = has a date AND not obsolete AND not error
    $set: {
      processed: {
        $and: [{ $ne: ['$date', null] }, { $not: '$state.obsolete' }, { $not: '$state.error' }],
      },
    },
  },
  {
    $group: {
      _id: null,
      total: { $sum: 1 },
      // All data
      labeled: { $sum: { $cond: ['$state.labeled', 1, 0] } },
      nonLabeled: { $sum: { $cond: [presentAndFalse('$state.labeled'), 1, 0] } },
      useForTraining: { $sum: { $cond: ['$useForTraining', 1, 0] } },
      // Status
      nonProcessed: { $sum: { $cond: [{ $eq: ['$date', null] }, 1, 0] } },
      obsolete: {
        $sum: { $cond: [{ $and: [{ $ne: ['$date', null] }, '$state.obsolete'] }, 1, 0] },
      },
      error: {
        $sum: { $cond: [{ $and: [{ $ne: ['$date', null] }, '$state.error'] }, 1, 0] },
      },
      // Processed (exclude nonProcessed, obsolete, and error)
      match: { $sum: { $cond: [{ $and: ['$processed', '$state.match'] }, 1, 0] } },
      mismatch: {
        $sum: { $cond: [{ $and: ['$processed', presentAndFalse('$state.match')] }, 1, 0] },
      },
      noContext: {
        $sum: { $cond: [{ $and: ['$processed', { $not: '$state.hasContext' }] }, 1, 0] },
      },
      // Support for accuracy calculation
      processedLabeled: { $sum: { $cond: [{ $and: ['$processed', '$state.labeled'] }, 1, 0] } },
    },
  },
  {
    $set: {
      accuracy: {
        $cond: [
          { $gt: ['$processedLabeled', 0] },
          { $round: [{ $multiply: [{ $divide: ['$match', '$processedLabeled'] }, 100] }, 2] },
          0,
        ],
      },
    },
  },
  { $unset: 'processedLabeled' },
];

/**
 * Mongo implementation of {@link IXSuggestionsStatsQueryService}.
 *
 * Extends `MongoDataSource` and declares its own collection rather than taking the DAO by
 * injection: reaching the pipeline through the DAO would force either a DAO method shaped like a
 * pipeline or a public collection accessor, and both reopen the leak the port exists to close.
 * Same shape as `MongoPXEntityStatusesQueryService`.
 */
export class MongoIXSuggestionsStatsQueryService
  extends MongoDataSource<Suggestion>
  implements IXSuggestionsStatsQueryService
{
  protected collectionName = ixSuggestionsCollection;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async getStatsForExtractor(extractorId: ObjectIdSchema): Promise<SuggestionStats> {
    const results = await this.getCollection()
      .aggregate<SuggestionStats & { _id: null }>(
        statsPipeline(new ObjectId(extractorId.toString()))
      )
      .toArray();

    if (!results.length) {
      return { ...emptyStats };
    }

    const [{ _id, ...stats }] = results;
    return stats;
  }
}
