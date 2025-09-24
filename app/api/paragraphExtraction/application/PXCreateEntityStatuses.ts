// @ts-expect-error TS(2307): Cannot find module '../settings.v2/contracts/Setti... Remove this comment to see the full error message
import { SettingsDataSource } from '../settings.v2/contracts/SettingsDataSource.js';

import { LanguagesListSchema } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/infrastructure/err... Remove this comment to see the full error message
import { NonRetryableJobError } from '../queue.v2/infrastructure/errors.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
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
    // @ts-expect-error TS(7006): Parameter 'l' implicitly has an 'any' type.
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
