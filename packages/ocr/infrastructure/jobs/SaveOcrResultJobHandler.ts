import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
// eslint-disable-next-line import/no-cycle
import { SaveOcrResultFactory } from '../factories/SaveOcrResultFactory.js';
import { OcrOutcomeParams, OutcomeParams } from './OcrOutcomeParams.js';

type Params = UwaziJobParams & OutcomeParams;

@PrivilegedJob()
class SaveOcrResultJobHandler extends UwaziJobHandler<Params> {
  // eslint-disable-next-line class-methods-use-this
  protected async handle(_heartbeat: HeartbeatCallback, params: Params) {
    await SaveOcrResultFactory.default().execute(OcrOutcomeParams.toOutcome(params));
  }
}

export { SaveOcrResultJobHandler };
