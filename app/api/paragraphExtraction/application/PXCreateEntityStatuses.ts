import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { LanguagesListSchema } from 'shared/types/commonTypes';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { UseCase } from 'api/core/libs/UseCase';
import { PXExtractorsQueryService } from '../domain/PXExtractorsQueryService';
import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { EntityStatus } from '../domain/PXEntityStatusModel';
import { PXEntityStatusesQueryService } from '../domain/PXEntityStatusesQueryService';

type Input = {
  extractorId: string;
  sourceTemplateId: string;
};

type Output = {
  processedEntities: number;
};

interface Dependencies {
  pxEntityStatusesQueryService: PXEntityStatusesQueryService;
  pxEntitiesStatusDS: PXEntitiesStatusDataSource;
  extractorsQueryService: PXExtractorsQueryService;
  settingsDS: SettingsDataSource;
}

class PXCreateEntityStatuses implements UseCase<Input, Output> {
  private dependencies: Dependencies;

  private batchSize: number;

  constructor(dependencies: Dependencies, batchSize: number) {
    this.dependencies = dependencies;
    this.batchSize = batchSize;
  }

  private async getLanguages(): Promise<{
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

  private async processBatch(
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

  async execute(input: Input): Promise<Output> {
    const { extractorId, sourceTemplateId } = input;
    const { installed, defaultLangKey } = await this.getLanguages();

    const unprocessedEntitiesBatch =
      await this.dependencies.pxEntityStatusesQueryService.fetchUnprocessedEntities({
        sourceTemplateId,
        extractorId,
        defaultLanguageKey: defaultLangKey,
        installedLanguages: installed,
        batchSize: this.batchSize,
      });

    if (unprocessedEntitiesBatch.length === 0) {
      return { processedEntities: 0 };
    }

    await this.processBatch(unprocessedEntitiesBatch, extractorId);
    return { processedEntities: unprocessedEntitiesBatch.length };
  }
}

export { PXCreateEntityStatuses };
export type { Input as PXCreateEntityStatusesInput, Output as PXCreateEntityStatusesOutput };
