import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';

import { GetExtractorsOutput, PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { MongoPXExtractorDBO } from './MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from './MongoPXExtractorsDataSource';
import { mongoPXExtractionsCollection } from './MongoPXExtractionsDataSource';

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
        $lookup: {
          from: mongoPXExtractionsCollection,
          localField: '_id',
          foreignField: 'extractorId',
          as: 'extractions',
        },
      },
      {
        $project: {
          _id: 1,
          sourceTemplateId: 1,
          targetTemplateId: 1,
          extractions: 1,
          sourceEntities: 1,
        },
      },
    ]);

    return new MongoResultSet(
      cursor,
      item =>
        ({
          _id: item._id.toString(),
          sourceTemplateId: item.sourceTemplateId.toString(),
          targetTemplateId: item.targetTemplateId.toString(),
          count: {
            generatedEntities: item.sourceEntities.length,
            new: item.sourceEntities.length - item.extractions.length,
          },
        }) as GetExtractorsOutput
    );
  }
}

export { MongoPXExtractorsQueryService };
