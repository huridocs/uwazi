// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
// @ts-expect-error TS(2307): Cannot find module '../queue.v2/application/contra... Remove this comment to see the full error message
import { JobsDispatcher } from '../queue.v2/application/contracts/JobsDispatcher.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/Array.js' o... Remove this comment to see the full error message
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
    // @ts-expect-error TS(7006): Parameter 'entitySharedId' implicitly has an 'any'... Remove this comment to see the full error message
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
