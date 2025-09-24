import { ObjectId } from 'mongodb';

import { LanguagesListSchema } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/entityType.... Remove this comment to see the full error message
import { EntitySchema } from 'shared/types/entityType.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/database/MongoDat... Remove this comment to see the full error message
import { MongoDataSource } from 'api/common.v2/database/MongoDataSource.js';
import { mongoPXEntitiesStatusCollection } from './MongoPXEntitiesStatusDataSource';
import { PXEntityStatusesQueryService } from '../domain/PXEntityStatusesQueryService';

interface BuildAggregationPipelineParams {
  sourceTemplateId: string;
  extractorId: string;
  defaultLanguageKey: string;
  installedLanguages: LanguagesListSchema;
  batchSize: number;
}

class MongoPXEntityStatusesQueryService
  extends MongoDataSource<EntitySchema>
  implements PXEntityStatusesQueryService
{
  protected collectionName = 'entities';

  private static filterDocumentsWithUILanguagesQuery(installedLanguages: LanguagesListSchema) {
    return {
      $lookup: {
        from: 'files',
        let: { entitySharedId: '$sharedId' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$entity', '$$entitySharedId'] },
                  // @ts-expect-error TS(7006): Parameter 'l' implicitly has an 'any' type.
                  { $in: ['$language', installedLanguages.map(l => l.ISO639_3)] },
                ],
              },
            },
          },
          { $project: { _id: 1 } },
        ],
        as: 'filesWithLanguage',
      },
    };
  }

  private static buildAggregationPipeline(params: BuildAggregationPipelineParams): any[] {
    return [
      {
        $match: {
          template: new ObjectId(params.sourceTemplateId),
          language: params.defaultLanguageKey,
        },
      },
      MongoPXEntityStatusesQueryService.filterDocumentsWithUILanguagesQuery(
        params.installedLanguages
      ),
      {
        $match: {
          'filesWithLanguage.0': { $exists: true },
        },
      },
      {
        $lookup: {
          from: mongoPXEntitiesStatusCollection,
          let: { entitySharedIdToCheck: '$sharedId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$entitySharedId', '$$entitySharedIdToCheck'] },
                    { $eq: ['$extractorId', new ObjectId(params.extractorId)] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'existingStatuses',
        },
      },
      { $match: { 'existingStatuses.0': { $exists: false } } },
      { $limit: params.batchSize },
      { $project: { sharedId: 1, _id: 0 } },
    ];
  }

  async fetchUnprocessedEntities(
    params: BuildAggregationPipelineParams
  ): Promise<{ sharedId: string }[]> {
    const aggregationPipeline = MongoPXEntityStatusesQueryService.buildAggregationPipeline(params);

    // @ts-expect-error TS(2339): Property 'getCollection' does not exist on type 'M... Remove this comment to see the full error message
    const entitiesCollection = this.getCollection();
    const unprocessedEntitiesBatch = await entitiesCollection
      .aggregate<{ sharedId: string }>(aggregationPipeline)
      .toArray();

    return unprocessedEntitiesBatch;
  }
}

export { MongoPXEntityStatusesQueryService };
