import { Db, Document, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import {
  IXTrainingMaterialsQueryService,
  TrainingFileRow,
  TrainingMaterialsQuery,
} from '../domain/IXTrainingMaterialsQueryService.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
};

const ixSuggestionsCollection = 'ixsuggestions';

/**
 * Both `$unwind`s are the filter, not a formality: a suggestion whose file is not ready, or whose
 * segmentation is missing or unfinished, produces an empty array and drops out of the walk. That
 * is how unusable documents are kept out of a training run.
 */
const trainingPipeline = ({ extractorId, property, limit }: TrainingMaterialsQuery): Document[] => [
  {
    $match: {
      extractorId: new ObjectId(extractorId.toString()),
      currentValue: { $nin: ['', null, undefined], $ne: [] },
    },
  },
  { $limit: limit },
  {
    $lookup: {
      from: 'entities',
      localField: 'entityLanguageId',
      foreignField: '_id',
      as: 'entityLanguage',
      pipeline: [{ $project: { metadata: `$metadata.${property}` } }],
    },
  },
  { $unwind: '$entityLanguage' },
  {
    $lookup: {
      from: 'files',
      localField: 'fileId',
      foreignField: '_id',
      as: 'file',
      pipeline: [
        { $match: { status: 'ready' } },
        {
          $project: {
            propertySelections: {
              $filter: {
                input: '$propertySelections',
                as: 'item',
                cond: { $eq: ['$$item.name', property] },
              },
            },
            filename: 1,
          },
        },
      ],
    },
  },
  { $unwind: '$file' },
  {
    $lookup: {
      from: 'segmentations',
      localField: 'fileId',
      foreignField: 'fileID',
      as: 'segmentation',
      pipeline: [
        { $match: { status: 'ready' } },
        { $project: { propertySelections: 1, filename: 1, xmlname: 1, segmentation: 1 } },
      ],
    },
  },
  { $unwind: '$segmentation' },
];

/**
 * Mongo implementation of {@link IXTrainingMaterialsQueryService}. Extends `MongoDataSource` and
 * owns its collection, like the other IX query services.
 */
export class MongoIXTrainingMaterialsQueryService
  extends MongoDataSource<Suggestion>
  implements IXTrainingMaterialsQueryService
{
  protected collectionName = ixSuggestionsCollection;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
  }

  streamFilesForTraining(query: TrainingMaterialsQuery) {
    return this.getCollection().aggregate<TrainingFileRow>(trainingPipeline(query));
  }
}
