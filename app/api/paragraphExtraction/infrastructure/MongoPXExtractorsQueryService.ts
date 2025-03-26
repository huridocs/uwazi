import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';

import { GetExtractorsOutput, PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { MongoPXExtractorDBO } from './MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from './MongoPXExtractorsDataSource';
import { mongoPXEntitiesStatusCollection } from './MongoPXEntitiesStatusDataSource';
import { EntityStatus } from '../domain/PXEntityStatusModel';

class MongoPXExtractorsQueryService
  extends MongoDataSource<MongoPXExtractorDBO>
  implements PXExtractorsQueryService
{
  protected collectionName = mongoPXExtractorsCollection;

  getExtractors(): ResultSet<GetExtractorsOutput> {
    const cursor = this.getCollection().aggregate([
      {
        $lookup: {
          from: mongoPXEntitiesStatusCollection,
          localField: '_id',
          foreignField: 'extractorId',
          as: 'statusData',
        },
      },
      {
        $addFields: {
          statusCount: {
            [EntityStatus.New]: {
              $size: {
                $filter: {
                  input: '$statusData',
                  as: 'status',
                  cond: { $eq: ['$$status.status', EntityStatus.New] },
                },
              },
            },
            [EntityStatus.Processing]: {
              $size: {
                $filter: {
                  input: '$statusData',
                  as: 'status',
                  cond: { $eq: ['$$status.status', EntityStatus.Processing] },
                },
              },
            },
            [EntityStatus.Obsolete]: {
              $size: {
                $filter: {
                  input: '$statusData',
                  as: 'status',
                  cond: { $eq: ['$$status.status', EntityStatus.Obsolete] },
                },
              },
            },
            [EntityStatus.Error]: {
              $size: {
                $filter: {
                  input: '$statusData',
                  as: 'status',
                  cond: { $eq: ['$$status.status', EntityStatus.Error] },
                },
              },
            },
            [EntityStatus.Processed]: {
              $size: {
                $filter: {
                  input: '$statusData',
                  as: 'status',
                  cond: { $eq: ['$$status.status', EntityStatus.Processed] },
                },
              },
            },
            total: { $size: '$statusData' },
          },
        },
      },
      {
        $project: {
          _id: 1,
          sourceTemplateId: 1,
          targetTemplateId: 1,
          statusCount: 1,
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
          statusCount: item.statusCount,
        }) as GetExtractorsOutput
    );
  }
}

export { MongoPXExtractorsQueryService };
