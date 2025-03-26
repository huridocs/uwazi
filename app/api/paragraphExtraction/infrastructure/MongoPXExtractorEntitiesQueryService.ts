import { ObjectId } from 'mongodb';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';

import {
  PXExtractorEntitiesQueryService,
  GetExtractorEntitiesOutput,
  GetExtractorEntitiesInput,
} from '../domain/PXExtractorEntitesQueryService';
import { MongoPXEntityStatus } from './MongoPXEntityStatus';
import { mongoPXEntitiesStatusCollection } from './MongoPXEntitiesStatusDataSource';

class MongoPXExtractorEntitiesQueryService
  extends MongoDataSource<MongoPXEntityStatus>
  implements PXExtractorEntitiesQueryService
{
  protected collectionName = mongoPXEntitiesStatusCollection;

  async getExtractorEntities(
    input: GetExtractorEntitiesInput
  ): Promise<GetExtractorEntitiesOutput> {
    const number = input.page?.number || 1;
    const size = input.page?.size || 10;
    const skip = (number - 1) * size;

    const results = (await this.getCollection()
      .aggregate([
        { $match: { extractorId: new ObjectId(input.id) } },
        {
          $lookup: {
            from: 'entities',
            let: { sharedId: '$entitySharedId', lang: input.language },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$sharedId', '$$sharedId'] }, { $eq: ['$language', '$$lang'] }],
                  },
                },
              },
              { $project: { title: 1 } },
            ],
            as: 'entityData',
          },
        },
        { $unwind: '$entityData' },
        {
          $lookup: {
            from: 'files',
            let: { sharedId: '$entitySharedId' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$entity', '$$sharedId'] },
                },
              },
              { $match: { language: { $in: languages } } },
            ],
            as: 'fileData',
          },
        },
        {
          $addFields: {
            fileLanguages: {
              $map: {
                input: '$fileData',
                as: 'file',
                in: '$$file.language',
              },
            },
          },
        },
        { $sort: { 'entityData.title': 1 } },
        {
          $facet: {
            rows: [{ $skip: skip }, { $limit: size }],
            totalRows: [{ $count: 'total' }],
          },
        },
        {
          $addFields: {
            page: { number, size },
            totalRows: { $arrayElemAt: ['$totalRows.total', 0] },
          },
        },
      ])
      .toArray()) as unknown as GetExtractorEntitiesOutput[];

    return results[0] || { rows: [], page: { number, size }, totalRows: 0 };
  }
}

export { MongoPXExtractorEntitiesQueryService };
