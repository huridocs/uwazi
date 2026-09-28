import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { SaveSegmentationResultFactory } from '../factories/SaveSegmentationResultFactory.js';
import { OutcomeParams, SegmentationOutcomeParams } from './SegmentationOutcomeParams.js';

type Params = UwaziJobParams & OutcomeParams;

@PrivilegedJob()
class SaveSegmentationResultJobHandler extends UwaziJobHandler<Params> {
  protected async handle(_heartbeat: HeartbeatCallback, params: Params) {
    await SaveSegmentationResultFactory.default().execute(
      SegmentationOutcomeParams.toOutcome(params)
    );
  }
}

export { SaveSegmentationResultJobHandler };
