import {
  Dispatchable,
  HeartbeatCallback,
  JobInfo,
} from 'api/core/libs/queue/application/contracts/Dispatchable';
import {
  JobsDispatcher,
  DispatchableClass,
} from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { PXCreateEntityStatuses } from '../application/PXCreateEntityStatuses';

interface SpecificJobParams {
  extractorId: string;
  sourceTemplateId: string;
}

interface Dependencies {
  createEntityStatusesUseCase: PXCreateEntityStatuses;
  dispatcher: JobsDispatcher;
}

class CreateParagraphExtractionEntityStatusesJob implements Dispatchable {
  private dependencies: Dependencies;

  private batchSize: number;

  constructor(dependencies: Dependencies, batchSize: number) {
    this.dependencies = dependencies;
    this.batchSize = batchSize;
  }

  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    paramsFromDispatcher: Record<string, any>,
    _jobInfo?: JobInfo
  ): Promise<void> {
    const params = paramsFromDispatcher as SpecificJobParams;
    const { extractorId, sourceTemplateId } = params;

    const result = await this.dependencies.createEntityStatusesUseCase.execute({
      extractorId,
      sourceTemplateId,
    });

    if (result.processedEntities > 0 && result.processedEntities === this.batchSize) {
      await this.dependencies.dispatcher.dispatch(
        CreateParagraphExtractionEntityStatusesJob as DispatchableClass<any>,
        { extractorId, sourceTemplateId }
      );
    }
  }
}

export { CreateParagraphExtractionEntityStatusesJob };
export type { SpecificJobParams as CreateParagraphExtractionEntityStatusesJobParams };
