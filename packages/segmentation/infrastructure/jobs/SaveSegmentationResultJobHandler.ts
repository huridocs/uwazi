import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UseCase } from '#api/core/libs/UseCase.js';
import { SegmentationOutcome } from '../../application/contracts/SegmentationOutcome.js';
import { OutcomeParams, SegmentationOutcomeParams } from './SegmentationOutcomeParams.js';

type Params = UwaziJobParams & OutcomeParams;

type Deps = {
  saveSegmentationResult: UseCase<SegmentationOutcome, void>;
};

@PrivilegedJob()
class SaveSegmentationResultJobHandler extends UwaziJobHandler<Params> {
  constructor(private readonly deps: Deps) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, params: Params) {
    await this.deps.saveSegmentationResult.execute(SegmentationOutcomeParams.toOutcome(params));
  }
}

export { SaveSegmentationResultJobHandler };
