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
          localField: 'sourceTemplateId',
          foreignField: 'template',
          as: 'sourceEntities',
          pipeline: [{ $group: { _id: '$sharedId' } }],
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
      // Add a new field sourceEntitiesCount which is the size of the Entities that can be extracted
      {
        $addFields: {
          sourceEntitiesCount: { $size: '$sourceEntities' },
        },
      },
      // Project the required fields
      {
        $project: {
          _id: 1,
          sourceTemplate: 1,
          targetTemplate: 1,
          sourceEntitiesCount: 1,
        },
      },
    ]);

    return new MongoResultSet(
      cursor,
      item =>
        ({
          extractorId: item._id,
          sourceEntitiesCount: item.sourceEntitiesCount,
          sourceTemplate: { templateId: item.sourceTemplate._id, name: item.sourceTemplate.name },
          targetTemplate: { templateId: item.targetTemplate._id, name: item.targetTemplate.name },
        }) as GetExtractorsOutput
    );
  }
}

export { MongoPXExtractorsQueryService };
