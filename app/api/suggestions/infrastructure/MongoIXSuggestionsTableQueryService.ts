import { Db, Document, Filter, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import {
  IXSuggestionsTableQueryService,
  SuggestionStatusFilter,
  SuggestionSort,
  SuggestionTableRow,
  TableQuery,
} from '../domain/IXSuggestionsTableQueryService.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const ixSuggestionsCollection = 'ixsuggestions';

/** Dated, and neither obsolete nor errored — the precondition of the three quality filters. */
const processed = {
  date: { $ne: null },
  'state.obsolete': { $ne: true },
  'state.error': { $ne: true },
};

/**
 * One mongo fragment per status flag. Moved here from `pipelineStages.ts`, where it was reachable
 * by callers; a caller that can build a filter fragment can build any query, which is what the
 * port exists to prevent.
 */
const filterFragments: Record<keyof SuggestionStatusFilter, Document> = {
  // All data
  labeled: { 'state.labeled': true },
  nonLabeled: { 'state.labeled': false },
  useForTraining: { useForTraining: true },
  // Status
  nonProcessed: { date: null },
  obsolete: { date: { $ne: null }, 'state.obsolete': true },
  error: { date: { $ne: null }, 'state.error': true },
  // Processed (exclude nonProcessed, obsolete, and error)
  match: { ...processed, 'state.match': true },
  mismatch: { ...processed, 'state.match': false },
  noContext: { ...processed, 'state.hasContext': false },
};

const matchFor = (extractorId: ObjectId, statusFilter?: SuggestionStatusFilter) => {
  const match: Filter<Suggestion> = { extractorId };

  const selected = statusFilter
    ? (Object.keys(filterFragments) as (keyof SuggestionStatusFilter)[])
        .filter(flag => statusFilter[flag])
        .map(flag => filterFragments[flag])
    : [];

  if (selected.length) {
    match.$or = selected;
  }

  return match;
};

const sortFor = (sort?: SuggestionSort): Document => {
  if (!sort?.field?.length || !sort.order) {
    return { entityTitle: 1 };
  }

  return { [sort.field]: sort.order === 'asc' ? 1 : -1 };
};

/**
 * The table renames three of the stored fields, so this projection is part of the contract rather
 * than an optimisation: `sharedId` is the suggestion's `entityId`, and `entityId` is the id of the
 * language-specific entity document.
 */
const projection: Document = {
  sharedId: '$entityId',
  entityId: '$entityLanguageId',
  entityTemplateId: '$entityTemplate',
  currentValue: 1,
  entityTitle: 1,
  language: 1,

  _id: 1,
  propertyName: 1,
  extractorId: 1,
  suggestedValue: 1,
  segment: 1,
  state: 1,
  date: 1,
  error: 1,
  fileId: 1,
  status: 1,
  useForTraining: { $ifNull: ['$useForTraining', false] },
};

/**
 * Mongo implementation of {@link IXSuggestionsTableQueryService}. Extends `MongoDataSource` and
 * owns its collection for the same reason `MongoIXSuggestionsStatsQueryService` does.
 */
export class MongoIXSuggestionsTableQueryService
  extends MongoDataSource<Suggestion>
  implements IXSuggestionsTableQueryService
{
  protected collectionName = ixSuggestionsCollection;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  async getForTable({ extractorId, statusFilter, sort, page }: TableQuery) {
    const match = matchFor(new ObjectId(extractorId.toString()), statusFilter);
    const collection = this.getCollection();

    const total = await collection.countDocuments(match as Filter<Document>);

    const rows = await collection
      .aggregate<SuggestionTableRow>([
        { $match: match },
        { $sort: sortFor(sort) },
        { $skip: page.skip },
        { $limit: page.limit },
        { $project: projection },
      ])
      .toArray();

    return { rows, total };
  }
}
