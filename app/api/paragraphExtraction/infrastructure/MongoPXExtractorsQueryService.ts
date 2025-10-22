/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';

import { ResultSet } from 'api/core/libs/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';

import {
  GetEntityParagraphRelationshipsOutput,
  GetEntityParagraphRelationshipsInput,
  GetExtractedParagraphsOutput,
  GetExtractedParagraphsInput,
  GetExtractorsOutput,
  GetExtractorStatusesInput,
  GetExtractorStatusesOutput,
  PXExtractorsQueryService,
} from '../domain/PXExtractorsQueryService';
import { EntityStatus } from '../domain/PXEntityStatusModel';
import { MongoPXExtractorDBO } from './MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from './MongoPXExtractorsDataSource';
import { mongoPXEntitiesStatusCollection } from './MongoPXEntitiesStatusDataSource';
import { PXEntityStatusMapper } from './PXEntityStatusMapper';

const getDefaultPagination = (inputNumber?: number, inputSize?: number) => {
  const number = inputNumber || 1;
  const size = inputSize || 10;
  const skip = (number - 1) * size;
  return { number, size, skip };
};

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
                  cond: {
                    $in: [
                      '$$status.status',
                      [EntityStatus.Processing, EntityStatus.ProcessingObsolete],
                    ],
                  },
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
          paragraphNumberPropertyId: 1,
          paragraphPropertyId: 1,
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
          paragraphNumberPropertyId: item.paragraphNumberPropertyId.toString(),
          paragraphPropertyId: item.paragraphPropertyId.toString(),
          statusCount: item.statusCount,
        }) as GetExtractorsOutput
    );
  }

  getExtractorStatuses(input: GetExtractorStatusesInput): ResultSet<GetExtractorStatusesOutput> {
    const { number, size, skip } = getDefaultPagination(input.page?.number, input.page?.size);

    if (input.filter?.status?.includes(EntityStatus.Processing)) {
      input.filter.status.push(EntityStatus.ProcessingObsolete);
    }

    const cursor = this.getCollection().aggregate([
      { $match: { _id: ObjectId.createFromHexString(input.id) } },
      {
        $lookup: {
          from: mongoPXEntitiesStatusCollection,
          localField: '_id',
          foreignField: 'extractorId',
          as: 'status',
        },
      },
      { $unwind: '$status' },
      {
        $match: {
          ...(input.filter?.status && input.filter.status.length > 0
            ? { 'status.status': { $in: input.filter.status } }
            : {}),
        },
      },
      { $project: { 'status._id': 1, 'status.status': 1, 'status.entitySharedId': 1 } },
      {
        $lookup: {
          from: 'entities',
          let: { sharedId: '$status.entitySharedId', lang: input.language },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ['$sharedId', '$$sharedId'] }, { $eq: ['$language', '$$lang'] }],
                },
              },
            },
            { $project: { sharedId: 1, title: 1, language: 1 } },
          ],
          as: 'entity',
        },
      },
      { $unwind: '$entity' },
      {
        $project: {
          status: { _id: 1, status: 1 },
          entity: 1,
        },
      },
      { $sort: { 'entity.title': 1 } },
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
    ]);

    return new MongoResultSet(
      cursor,
      item =>
        ({
          ...item,
          totalRows: item.totalRows || 0,
          rows: item.rows.map((r: GetExtractorStatusesOutput['rows'][0]) => ({
            entity: { ...r.entity, _id: r.entity._id.toString() },
            status: {
              ...r.status,
              _id: r.status._id.toString(),
              status: PXEntityStatusMapper.toDTO(r.status.status as any as EntityStatus),
            },
          })),
        }) as GetExtractorStatusesOutput
    );
  }

  getEntityParagraphRelationships(
    input: GetEntityParagraphRelationshipsInput
  ): ResultSet<GetEntityParagraphRelationshipsOutput> {
    const cursor = this.getCollection().aggregate([
      { $match: { _id: ObjectId.createFromHexString(input.extractorId) } },
      {
        $lookup: {
          from: mongoPXEntitiesStatusCollection,
          let: { extractorId: '$_id', entitySharedId: input.id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$extractorId', '$$extractorId'] },
                    { $eq: ['$entitySharedId', '$$entitySharedId'] },
                  ],
                },
              },
            },
          ],
          as: 'entityStatuses',
        },
      },
      {
        $unwind: {
          path: '$entityStatuses',
          preserveNullAndEmptyArrays: !(input.options?.requireEntityStatus ?? true),
        },
      },
      {
        $addFields: {
          entityIdForLookup: {
            $ifNull: ['$entityStatuses.entitySharedId', input.id],
          },
        },
      },
      {
        $lookup: {
          from: 'connections',
          localField: 'entityIdForLookup',
          foreignField: 'entity',
          as: 'sourceRelationships',
        },
      },
      {
        $unwind: '$sourceRelationships',
      },
      {
        $match: { $expr: { $eq: ['$sourceRelationships.template', '$sourceRelationshipTypeId'] } },
      },
      {
        $lookup: {
          from: 'connections',
          let: {
            hubValue: '$sourceRelationships.hub',
            targetTemplate: '$targetRelationshipTypeId',
            expectedTemplateId: '$targetTemplateId',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$hub', '$$hubValue'] },
                    { $eq: ['$template', '$$targetTemplate'] },
                  ],
                },
              },
            },
            {
              $lookup: {
                from: 'entities',
                let: {
                  targetEntityId: '$entity',
                  expectedTemplate: '$$expectedTemplateId',
                },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ['$sharedId', '$$targetEntityId'] },
                          { $eq: ['$template', '$$expectedTemplate'] },
                        ],
                      },
                    },
                  },
                ],
                as: 'matchingEntities',
              },
            },
            {
              $match: {
                matchingEntities: { $ne: [] },
              },
            },
          ],
          as: 'targetRelationships',
        },
      },
      { $unwind: '$targetRelationships' },
      {
        $project: {
          _id: '$targetRelationships._id',
          entity: '$targetRelationships.entity',
          hub: '$targetRelationships.hub',
          template: '$targetRelationships.template',
        },
      },
    ]);

    return new MongoResultSet(cursor, item => ({
      id: item._id.toString(),
      entitySharedId: item.entity,
      hubId: item.hub.toString(),
      relationshipTypeId: item.template.toString(),
    }));
  }

  getExtractedParagraphs(
    input: GetExtractedParagraphsInput
  ): ResultSet<GetExtractedParagraphsOutput> {
    const { number, size, skip } = getDefaultPagination(input.page?.number, input.page?.size);
    const cursor = this.getCollection('entities').aggregate([
      {
        $match: {
          sharedId: { $in: input.ids },
        },
      },
      {
        $addFields: {
          languageSortOrder: {
            $cond: {
              if: { $eq: ['$language', input.mainLanguage] },
              then: 0,
              else: 1,
            },
          },
        },
      },
      {
        $sort: {
          sharedId: 1,
          languageSortOrder: 1,
          language: 1,
        },
      },
      {
        $group: {
          _id: '$sharedId',
          entities: { $push: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'entities',
          let: { sharedId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$sharedId', '$$sharedId'] } } },
            { $sort: { [`metadata.${input.paragraphNumberProperty}.value`]: 1 } },
            { $limit: 1 },
          ],
          as: 'sortedMetadata',
        },
      },
      {
        $addFields: {
          sortValue: {
            $arrayElemAt: [`$sortedMetadata.metadata.${input.paragraphNumberProperty}.value`, 0],
          },
        },
      },
      {
        $sort: { sortValue: 1 },
      },
      {
        $facet: {
          totalCount: [{ $count: 'count' }],
          rows: [{ $skip: skip }, { $limit: size }],
        },
      },
      {
        $addFields: {
          totalRows: { $ifNull: [{ $arrayElemAt: ['$totalCount.count', 0] }, 0] },
          page: { number, size },
        },
      },
      {
        $project: {
          rows: {
            $map: {
              input: '$rows',
              as: 'row',
              in: {
                sharedId: '$$row._id',
                entities: '$$row.entities',
              },
            },
          },
          totalRows: 1,
          page: 1,
        },
      },
    ]);

    return new MongoResultSet(cursor, item => item as GetExtractedParagraphsOutput);
  }
}

export { MongoPXExtractorsQueryService };
