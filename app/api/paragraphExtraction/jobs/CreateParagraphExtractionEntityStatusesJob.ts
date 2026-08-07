import {
  DispatchableClass,
} from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { PXCreateEntityStatuses } from '../application/PXCreateEntityStatuses.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';

type SpecificJobParams = UwaziJobParams & {
  extractorId: string;
  sourceTemplateId: string;
};

interface Dependencies {
  createEntityStatusesUseCase: PXCreateEntityStatuses;
  dispatcher: JobsDispatcher;
}

@PrivilegedJob()
class CreateParagraphExtractionEntityStatusesJob extends UwaziJobHandler<SpecificJobParams> {
  private dependencies: Dependencies;

  private batchSize: number;

  constructor(dependencies: Dependencies, batchSize: number) {
    super();
    this.dependencies = dependencies;
    this.batchSize = batchSize;
  }

  protected async handle(
    _heartbeat: any,
    params: SpecificJobParams
  ): Promise<void> {
    const { extractorId, sourceTemplateId } = params;

    const result = await this.dependencies.createEntityStatusesUseCase.execute({
      extractorId,
      sourceTemplateId,
    });

    if (result.processedEntities > 0 && result.processedEntities === this.batchSize) {
      await this.dependencies.dispatcher.dispatch(
        CreateParagraphExtractionEntityStatusesJob as DispatchableClass<any>,
        { extractorId, sourceTemplateId, userId: params.userId }
      );
    }
  }
}

export { CreateParagraphExtractionEntityStatusesJob };
export type { SpecificJobParams as CreateParagraphExtractionEntityStatusesJobParams };
