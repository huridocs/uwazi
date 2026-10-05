import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
// eslint-disable-next-line import/no-cycle
import { SaveSegmentationResultFactory } from '../factories/SaveSegmentationResultFactory.js';
import { OutcomeParams, SegmentationOutcomeParams } from './SegmentationOutcomeParams.js';

type Params = UwaziJobParams & OutcomeParams;

@PrivilegedJob()
class SaveSegmentationResultJobHandler extends UwaziJobHandler<Params> {
  // eslint-disable-next-line class-methods-use-this
  protected async handle(_heartbeat: HeartbeatCallback, params: Params) {
    await SaveSegmentationResultFactory.default().execute(
      SegmentationOutcomeParams.toOutcome(params)
    );
  }
}

export { SaveSegmentationResultJobHandler };
