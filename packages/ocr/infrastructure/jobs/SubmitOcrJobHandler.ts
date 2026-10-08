import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
// eslint-disable-next-line import/no-cycle
import { SubmitOcrFactory } from '../factories/SubmitOcrFactory.js';
import { OcrSettledNotifierFactory } from '../factories/OcrSettledNotifierFactory.js';

type Params = UwaziJobParams & { recordId: string };

@PrivilegedJob()
class SubmitOcrJobHandler extends UwaziJobHandler<Params> {
  // eslint-disable-next-line class-methods-use-this
  protected async handle(_heartbeat: HeartbeatCallback, { recordId }: Params) {
    const settled = await SubmitOcrFactory.default().execute({ recordId });
    OcrSettledNotifierFactory.default().notify(settled);
  }
}

export { SubmitOcrJobHandler };
