import { Db, Document, Filter, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { LanguagesListSchema } from '#shared/types/commonTypes.js';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import {
  IXSuggestionsStateQueryService,
  StateRecomputeQuery,
  StateRecomputeRow,
  StateRecomputeScope,
} from '../domain/IXSuggestionsStateQueryService.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const ixSuggestionsCollection = 'ixsuggestions';

/**
 * Selects the entity a suggestion should be judged against: its own language when the instance
 * has that language configured, the default language otherwise. Moved here from
 * `pipelineStages.ts`, where every caller could reach it.
 */
const entityStage = (languages: LanguagesListSchema): Document[] => {
  const defaultLanguage = languages.find(l => l.default)?.key;
  const configuredLanguages = languages.map(l => l.key);

  return [
    {
      $lookup: {
        from: 'entities',
        let: {
          localFieldEntityId: '$entityId',
          localFieldLanguage: {
            $cond: [
              { $not: [{ $in: ['$language', configuredLanguages] }] },
              defaultLanguage,
              '$language',
            ],
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$sharedId', '$$localFieldEntityId'] },
                  { $eq: ['$language', '$$localFieldLanguage'] },
                ],
              },
            },
          },
        ],
        as: 'entity',
      },
    },
    { $addFields: { entity: { $arrayElemAt: ['$entity', 0] } } },
  ];
};

/** Digs the extractor's property out of the entity, or reads its title. Always an array. */
const currentValueStage = (): Document[] => [
  {
    $addFields: {
      currentValue: {
        $cond: [
          { $eq: ['$propertyName', 'title'] },
          { v: [{ value: '$entity.title' }] },
          {
            $arrayElemAt: [
              {
                $filter: {
                  input: { $objectToArray: '$entity.metadata' },
                  as: 'property',
                  cond: { $eq: ['$$property.k', '$propertyName'] },
                },
              },
              0,
            ],
          },
        ],
      },
    },
  },
  { $addFields: { currentValue: '$currentValue.v' } },
  { $addFields: { currentValue: { $ifNull: ['$currentValue.value', []] } } },
];

const matchFor = (scope: StateRecomputeScope): Filter<Suggestion> =>
  scope.kind === 'all'
    ? {}
    : { _id: { $in: scope.ids.map(id => new ObjectId(id.toString())) } as any };

/**
 * Mongo implementation of {@link IXSuggestionsStateQueryService}.
 *
 * The pipeline this replaces also `$lookup`ed the file and the model to project `labeledValue`,
 * `labeledText` and `modelCreationDate`. Nothing read any of the three — `getSuggestionState`
 * works off `currentValue`, `suggestedValue`, `error`, `date`, `segment` and `status` — so three
 * of the four joins were pure cost per row, and are gone. Removing them left the whole suite
 * green before this port existed.
 */
export class MongoIXSuggestionsStateQueryService
  extends MongoDataSource<Suggestion>
  implements IXSuggestionsStateQueryService
{
  protected collectionName = ixSuggestionsCollection;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  streamForStateRecompute({ scope, languages }: StateRecomputeQuery) {
    return this.getCollection().aggregate<StateRecomputeRow>([
      { $match: matchFor(scope) },
      ...entityStage(languages),
      ...currentValueStage(),
      { $unset: 'entity' },
      {
        $project: {
          _id: 1,
          propertyName: 1,
          extractorId: 1,
          currentValue: 1,
          suggestedValue: 1,
          error: 1,
          date: 1,
          segment: 1,
          status: 1,
        },
      },
    ]);
  }
}
