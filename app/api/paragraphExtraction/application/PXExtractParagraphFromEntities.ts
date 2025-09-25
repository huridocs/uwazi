import { UseCase } from '../common.v2/contracts/UseCase.js';

import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';

import { ArrayUtils } from '../common.v2/utils/Array.js';

import { PXEntitiesStatusDataSource } from '../domain/PXEntitiesStatusDataSource';
import { PXExtractParagraphsFromEntityJob } from '../infrastructure/PXExtractParagraphsFromEntityJob';
import { EntityStatus } from '../domain/PXEntityStatusModel';

type Input = {
  userId: string;
  extractorId: string;
  entitySharedIds: string[];
};

type Output = any;

type Dependencies = {
  dispatcher: JobsDispatcher;
  entitiesStatusDS: PXEntitiesStatusDataSource;
  tenantName: string;
};

class PXExtractParagraphsFromEntities implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute({ entitySharedIds, extractorId, userId }: Input): Promise<Output> {
    await ArrayUtils.sequentialFor(entitySharedIds, async entitySharedId => {
      const entityStatus = await this.dependencies.entitiesStatusDS.getExisting({
        entitySharedId,
        extractorId,
      });

      if (
        !entityStatus?.status ||
        [EntityStatus.Processing, EntityStatus.ProcessingObsolete].includes(entityStatus?.status)
      ) {
        return;
      }

      await this.dependencies.entitiesStatusDS.markAsProcessing(entityStatus.id);

      await this.dependencies.dispatcher.dispatch(PXExtractParagraphsFromEntityJob, {
        entitySharedId,
        extractorId,
        userId,
        entityStatusId: entityStatus.id,
        tenantName: this.dependencies.tenantName,
      });
    });
  }
}

export { PXExtractParagraphsFromEntities };

export type { Input };
