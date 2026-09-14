import { Db, Document, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import {
  IXSuggestionsSampleQueryService,
  SampleQuery,
} from '../domain/IXSuggestionsSampleQueryService.js';
import { pendingMatch } from './MongoIXSuggestionsDataSource.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const ixSuggestionsCollection = 'ixsuggestions';

/**
 * Mongo implementation of {@link IXSuggestionsSampleQueryService}.
 *
 * Shares `pendingMatch` with the counts the sizes were computed from: sampling a different set
 * than the one counted would hand the run rows it never accounted for.
 */
export class MongoIXSuggestionsSampleQueryService
  extends MongoDataSource<Suggestion>
  implements IXSuggestionsSampleQueryService
{
  protected collectionName = ixSuggestionsCollection;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async sampleForProcess({ extractorId, statusFilter, sizes }: SampleQuery) {
    const base = pendingMatch(new ObjectId(extractorId.toString()), statusFilter);

    const pipeline: Document[] = [
      {
        $facet: {
          unlabeled: [
            { $match: { ...base, 'state.labeled': { $ne: true } } },
            { $sample: { size: sizes.unlabeled } },
          ],
          labeled: [
            { $match: { ...base, 'state.labeled': true } },
            { $sample: { size: sizes.labeled } },
          ],
        },
      },
      { $project: { suggestions: { $concatArrays: ['$unlabeled', '$labeled'] } } },
      { $unwind: '$suggestions' },
      { $replaceRoot: { newRoot: '$suggestions' } },
    ];

    return this.getCollection().aggregate<Suggestion>(pipeline).toArray();
  }
}
