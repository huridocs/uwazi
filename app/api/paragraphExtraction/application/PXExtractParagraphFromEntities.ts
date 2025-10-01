import { UseCase } from 'api/common.v2/contracts/UseCase';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { ArrayUtils } from 'api/common.v2/utils/Array';

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
