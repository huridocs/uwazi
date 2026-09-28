import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';
import { HeartbeatCallback } from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { UseCase } from '#api/core/libs/UseCase.js';

type Params = UwaziJobParams & { segmentationId: string };

type Deps = {
  requestSegmentation: UseCase<{ segmentationId: string }, void>;
};

@PrivilegedJob()
class RequestSegmentationJobHandler extends UwaziJobHandler<Params> {
  constructor(private readonly deps: Deps) {
    super();
  }

  protected async handle(_heartbeat: HeartbeatCallback, { segmentationId }: Params) {
    await this.deps.requestSegmentation.execute({ segmentationId });
  }
}

export { RequestSegmentationJobHandler };
