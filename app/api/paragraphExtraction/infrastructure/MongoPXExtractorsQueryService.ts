import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';

import { GetExtractorsOutput, PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { MongoPXExtractorDBO } from './MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from './MongoPXExtractorsDataSource';
import { mongoPXEntitiesStatusCollection } from './MongoPXEntitiesStatusDataSource';
import { MongoPXEntityStatus } from './MongoPXEntityStatus';

class MongoPXExtractorsQueryService
  extends MongoDataSource<MongoPXExtractorDBO>
  implements PXExtractorsQueryService
{
  protected collectionName = mongoPXExtractorsCollection;

  private static countNotExtractedEntities(
    sourceEntities: { _id: string }[],
    extractions: MongoPXEntityStatus[]
  ) {
    const isEntityExtracted = (entity: { _id: string }) =>
      extractions.some((e: MongoPXEntityStatus) => e.entitySharedId === entity._id);

    return sourceEntities.reduce(
      (counter: number, entity: { _id: string }) => counter + (isEntityExtracted(entity) ? 0 : 1),
      0
    );
  }

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
          from: mongoPXEntitiesStatusCollection,
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
            new: MongoPXExtractorsQueryService.countNotExtractedEntities(
              item.sourceEntities,
              item.extractions
            ),
          },
        }) as GetExtractorsOutput
    );
  }
}

export { MongoPXExtractorsQueryService };
