import { Db, Document, ObjectId } from 'mongodb';
import { MongoDataSource } from '#api/core/infrastructure/mongodb/common/MongoDataSource.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { SegmentationDirectory } from '#segmentation';
import { Suggestion } from '../domain/IXSuggestionsDataSource.js';
import {
  IXTrainingMaterialsQueryService,
  TrainingFileRow,
  TrainingMaterialsQuery,
} from '../domain/IXTrainingMaterialsQueryService.js';
import { TrainingSegmentationsJoin } from './TrainingSegmentationsJoin.js';

type Deps = {
  db: Db;
  transactionManager: MongoTransactionManager;
  segmentationDirectory: SegmentationDirectory;
};

const ixSuggestionsCollection = 'ixsuggestions';

/**
 * The `$unwind`s are the filter, not a formality: a suggestion whose entity is missing, or whose
 * file is missing or not ready, produces an empty array and drops out of the walk. Segmentations
 * belong to the segmentation module and are joined after, through its directory.
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

  private readonly segmentations: TrainingSegmentationsJoin;

  constructor(deps: Deps) {
    super(deps.db, deps.transactionManager);
    this.segmentations = new TrainingSegmentationsJoin(deps.segmentationDirectory);
  }

  streamFilesForTraining(query: TrainingMaterialsQuery) {
    return this.segmentations.join(
      this.getCollection().aggregate<Omit<TrainingFileRow, 'segmentation'>>(trainingPipeline(query))
    );
  }
}
