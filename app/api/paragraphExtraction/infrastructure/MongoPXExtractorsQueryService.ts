import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';

import {
  GetExtractorsInput,
  GetExtractorsOutput,
  PXExtractorsQueryService,
} from '../domain/PXExtractorsQueryService';
import { MongoPXExtractorDBO } from './MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from './MongoPXExtractorsDataSource';

class MongoPXExtractorsQueryService
  extends MongoDataSource<MongoPXExtractorDBO>
  implements PXExtractorsQueryService
{
  protected collectionName = mongoPXExtractorsCollection;

  getExtractors(input: GetExtractorsInput): ResultSet<GetExtractorsOutput> {
    const cursor = this.getCollection().aggregate([
      // Join with the templates collection to get sourceTemplate details
      {
        $lookup: {
          from: 'templates',
          localField: 'sourceTemplateId',
          foreignField: '_id',
          as: 'sourceTemplate',
          pipeline: [{ $project: { _id: 1, name: 1 } }],
        },
      },
      // Join with the templates collection to get targetTemplate details
      {
        $lookup: {
          from: 'templates',
          localField: 'targetTemplateId',
          foreignField: '_id',
          as: 'targetTemplate',
          pipeline: [{ $project: { _id: 1, name: 1 } }],
        },
      },
      // Join with the entities collection to get related entities
      {
        $lookup: {
          from: 'entities',
          localField: '_id',
          foreignField: 'extractorId',
          as: 'entities',
          pipeline: [{ $project: { _id: 1 } }],
        },
      },
      // Unwind the sourceTemplate array
      {
        $unwind: '$sourceTemplate',
      },
      // Unwind the targetTemplate array
      {
        $unwind: '$targetTemplate',
      },
      // Add a new field paragraphsQuantity which is the size of the entities array
      {
        $addFields: {
          paragraphsQuantity: { $size: '$entities' },
        },
      },
      // Project the required fields
      {
        $project: {
          _id: 1,
          sourceTemplate: 1,
          targetTemplate: 1,
          paragraphsQuantity: 1,
        },
      },
    ]);

    return new MongoResultSet(cursor, item => item as GetExtractorsOutput);
  }
}

export { MongoPXExtractorsQueryService };
