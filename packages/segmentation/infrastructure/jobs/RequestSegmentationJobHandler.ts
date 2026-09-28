import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
// eslint-disable-next-line import/no-cycle
import { RequestSegmentationFactory } from '../factories/RequestSegmentationFactory.js';

type Params = UwaziJobParams & { segmentationId: string };

@PrivilegedJob()
class RequestSegmentationJobHandler extends UwaziJobHandler<Params> {
  // eslint-disable-next-line class-methods-use-this
  protected async handle(_heartbeat: HeartbeatCallback, { segmentationId }: Params) {
    await RequestSegmentationFactory.default().execute({ segmentationId });
  }
}

export { RequestSegmentationJobHandler };
