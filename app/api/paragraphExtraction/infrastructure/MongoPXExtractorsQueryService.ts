/* eslint-disable max-lines */
import { ObjectId } from 'mongodb';

import { ResultSet } from 'api/common.v2/contracts/ResultSet';
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoResultSet } from 'api/common.v2/database/MongoResultSet';

import {
  GetEntityParagraphRelationshipsOutput,
  GetEntityParagrphRelationshipsInput,
  GetExtractorsOutput,
  GetExtractorStatusesInput,
  GetExtractorStatusesOutput,
  PXExtractorsQueryService,
} from '../domain/PXExtractorsQueryService';
import { EntityStatus } from '../domain/PXEntityStatusModel';
import { MongoPXExtractorDBO } from './MongoPXExtractorDBO';
import { mongoPXExtractorsCollection } from './MongoPXExtractorsDataSource';
import { mongoPXEntitiesStatusCollection } from './MongoPXEntitiesStatusDataSource';

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

  getExtractorStatuses(input: GetExtractorStatusesInput): ResultSet<GetExtractorStatusesOutput> {
    const number = input.page?.number || 1;
    const size = input.page?.size || 10;
    const skip = (number - 1) * size;

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
            status: { ...r.status, _id: r.status._id.toString() },
          })),
        }) as GetExtractorStatusesOutput
    );
  }

  getEntityParagraphRelationships(
    input: GetEntityParagrphRelationshipsInput
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
        $unwind: '$entityStatuses',
      },
      {
        $lookup: {
          from: 'connections',
          localField: 'entityStatuses.entitySharedId',
          foreignField: 'entity',
          as: 'sourceConnections',
        },
      },
      {
        $unwind: '$sourceConnections',
      },
      {
        $match: { $expr: { $eq: ['$sourceConnections.template', '$sourceRelationshipTypeId'] } },
      },
      {
        $lookup: {
          from: 'connections',
          let: { hubValue: '$sourceConnections.hub', targetTemplate: '$targetRelationshipTypeId' },
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
          ],
          as: 'targetConnections',
        },
      },
      { $unwind: '$targetConnections' },
      { $replaceRoot: { newRoot: '$targetConnections' } },
    ]);

    return new MongoResultSet(cursor, item => ({
      id: item._id.toString(),
      entitySharedId: item.entity,
      hubId: item.hub.toString(),
      relationshipTypeId: item.template.toString(),
    }));
  }
}

export { MongoPXExtractorsQueryService };
