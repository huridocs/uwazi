import { Db, ObjectId } from 'mongodb';
import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
} from 'api/queue.v2/application/contracts/Dispatchable';
import {
  JobsDispatcher,
  DispatchableClass,
} from 'api/queue.v2/application/contracts/JobsDispatcher';
import { SettingsDataSource } from 'api/settings.v2/contracts/SettingsDataSource';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { NonRetryableJobError } from 'api/queue.v2/infrastructure/errors';
import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { EntityStatus } from '../domain/PXEntityStatusModel';
import { mongoPXEntitiesStatusCollection } from '../infrastructure/MongoPXEntitiesStatusDataSource';

// Define types first
interface SpecificJobParams {
  extractorId: string;
  sourceTemplateId: string;
}

interface Dependencies {
  db: Db;
  settingsDS: SettingsDataSource;
  extractorsQueryService: PXExtractorsQueryService;
  pxEntitiesStatusDS: PXEntitiesStatusDataSource;
  dispatcher: JobsDispatcher;
}

class CreateParagraphExtractionEntityStatusesJob implements Dispatchable {
  private dependencies: Dependencies;

  private batchSize: number;

  constructor(dependencies: Dependencies, batchSize: number = 50) {
    this.dependencies = dependencies;
    this.batchSize = batchSize;
  }

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

  private async _getLanguages(): Promise<{
    installed: LanguagesListSchema;
    defaultLangKey: string;
  }> {
    const installedLanguages = await this.dependencies.settingsDS.getInstalledLanguages();
    if (!installedLanguages || installedLanguages.length === 0) {
      throw new NonRetryableJobError(new Error('No languages installed in settings.'));
    }
    const defaultLanguage = installedLanguages.find(l => l.default)?.key;
    if (!defaultLanguage) {
      throw new NonRetryableJobError(
        new Error(
          'Default language not found in installed languages. Cannot process entity statuses.'
        )
      );
    }
    return { installed: installedLanguages, defaultLangKey: defaultLanguage };
  }

  private _buildAggregationPipeline(
    sourceTemplateId: string,
    extractorId: string,
    defaultLanguageKey: string,
    installedLanguages: LanguagesListSchema
  ): any[] {
    return [
      {
        $match: {
          template: new ObjectId(sourceTemplateId),
          language: defaultLanguageKey,
        },
      },
      CreateParagraphExtractionEntityStatusesJob.filterDocumentsWithUILanguagesQuery(
        installedLanguages
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
                    { $eq: ['$extractorId', new ObjectId(extractorId)] },
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
      { $limit: this.batchSize },
      { $project: { sharedId: 1, _id: 0 } },
    ];
  }

  private async _processBatch(
    unprocessedEntities: { sharedId: string }[],
    extractorId: string
  ): Promise<void> {
    await Promise.all(
      unprocessedEntities.map(async entity => {
        const entityParagraphsRelationships = await this.dependencies.extractorsQueryService
          .getEntityParagraphRelationships({
            id: entity.sharedId,
            extractorId,
            options: { requireEntityStatus: false },
          })
          .all();

        const determinedStatus = entityParagraphsRelationships.length
          ? EntityStatus.Processed
          : EntityStatus.New;

        await this.dependencies.pxEntitiesStatusDS.createWithStatus({
          extractorId,
          entitySharedId: entity.sharedId,
          status: determinedStatus,
        });
      })
    );
  }

  // New private method to encapsulate core logic
  private async _fetchAndProcessEntities(
    extractorId: string,
    sourceTemplateId: string
  ): Promise<number> {
    const { db } = this.dependencies;
    const { installed: installedLanguages, defaultLangKey } = await this._getLanguages();

    const aggregationPipeline = this._buildAggregationPipeline(
      sourceTemplateId,
      extractorId,
      defaultLangKey,
      installedLanguages
    );

    const entitiesCollection = db.collection<EntitySchema>('entities');
    const unprocessedEntitiesBatch = await entitiesCollection
      .aggregate<{ sharedId: string }>(aggregationPipeline)
      .toArray();

    if (unprocessedEntitiesBatch.length === 0) {
      return 0;
    }

    await this._processBatch(unprocessedEntitiesBatch, extractorId);
    return unprocessedEntitiesBatch.length;
  }

  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    paramsFromDispatcher: Record<string, any>,
    _jobInfo?: JobInfo
  ): Promise<void> {
    const params = paramsFromDispatcher as SpecificJobParams;
    const { extractorId, sourceTemplateId } = params;
    const { dispatcher } = this.dependencies;

    const processedCount = await this._fetchAndProcessEntities(extractorId, sourceTemplateId);

    if (processedCount > 0 && processedCount === this.batchSize) {
      await dispatcher.dispatch(
        CreateParagraphExtractionEntityStatusesJob as DispatchableClass<any>,
        { extractorId, sourceTemplateId }
      );
    }
  }
}

export { CreateParagraphExtractionEntityStatusesJob };
export type { SpecificJobParams as CreateParagraphExtractionEntityStatusesJobParams };
