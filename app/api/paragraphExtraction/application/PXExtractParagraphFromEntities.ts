import { UseCase } from 'api/common.v2/contracts/UseCase';
import { JobsDispatcher } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { ArrayUtils } from 'api/common.v2/utils/Array';

import { PXExtractionsDataSource } from '../domain/PXExtractionDataSource';
import { PXExtractParagraphsFromEntityJob } from '../infrastructure/PXExtractParagraphsFromEntitiesJob';

type Input = {
  userId: string;
  extractorId: string;
  entitySharedIds: string[];
};

type Output = any;

type Dependencies = {
  dispatcher: JobsDispatcher;
  extractionsDS: PXExtractionsDataSource;
  tenantName: string;
};

class PXExtractParagraphsFromEntities implements UseCase<Input, Output> {
  constructor(private dependencies: Dependencies) {}

  async execute({ entitySharedIds, extractorId, userId }: Input): Promise<Output> {
    await ArrayUtils.sequentialFor(entitySharedIds, async entitySharedId => {
      const extraction = await this.dependencies.extractionsDS.create({
        entitySharedId,
        extractorId,
      });

      await this.dependencies.dispatcher.dispatch(PXExtractParagraphsFromEntityJob, {
        entitySharedId,
        extractorId,
        userId,
        extractionId: extraction.id,
        tenantName: this.dependencies.tenantName,
      });
    });
  }
}

export { PXExtractParagraphsFromEntities };

export type { Input };
