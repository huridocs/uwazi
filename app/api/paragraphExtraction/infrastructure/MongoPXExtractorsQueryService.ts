import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';

import { GetExtractorsOutput, PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { MongoPXExtractorDBO } from './MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from './MongoPXExtractorsDataSource';

class MongoPXExtractorsQueryService
  extends MongoDataSource<MongoPXExtractorDBO>
  implements PXExtractorsQueryService
{
  protected collectionName = mongoPXExtractorsCollection;

  getExtractors(): ResultSet<GetExtractorsOutput> {
    const cursor = this.getCollection().aggregate([
      {
        $lookup: {
          from: 'entities',
          localField: 'sourceTemplateId',
          foreignField: 'template',
          as: 'sourceEntities',
          pipeline: [{ $group: { _id: '$sharedId' } }],
        },
      },
      {
        $addFields: {
          count: {
            generatedEntities: { $size: '$sourceEntities' },
            new: 0,
          },
        },
      },
      // Project the required fields
      {
        $project: {
          _id: 1,
          sourceTemplateId: 1,
          targetTemplateId: 1,
          count: 1,
        },
      },
    ]);

    return new MongoResultSet(cursor, item => item as GetExtractorsOutput);
  }
}

export { MongoPXExtractorsQueryService };
