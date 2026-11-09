import { CreateImageThumbnail } from '../../application/CreateImageThumbnail.js';
import { ImageThumbnailRejected } from '../../domain/imageThumbnailErrors.js';
import {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { QueueOptions } from '#api/core/libs/queue/application/QueueOptions.js';
import { NonRetryableJobError } from '#api/core/libs/queue/infrastructure/errors.js';
import { PrivilegedJob } from '#api/core/infrastructure/jobs/PrivilegedJob.js';
import { UwaziJobHandler, UwaziJobParams } from '#api/core/infrastructure/jobs/UwaziJobHandler.js';

type Params = UwaziJobParams & {
  filename: string;
};

type JobDependencies = {
  useCase: CreateImageThumbnail;
};

@PrivilegedJob()
@QueueOptions({ lockWindow: 60_000, maxRetries: 3 })
class CreateImageThumbnailJobHandler extends UwaziJobHandler<Params> {
  constructor(private deps: JobDependencies) {
    super();
  }

  async handle(_heartbeat: HeartbeatCallback, params: Params, jobInfo?: JobInfo) {
    const giveUp =
      jobInfo !== undefined &&
      (jobInfo.retryCount === jobInfo.maxRetries || jobInfo.maxRetries === 0);
    try {
      await this.deps.useCase.execute({ filename: params.filename }, giveUp);
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      if (failure instanceof ImageThumbnailRejected || giveUp) {
        throw new NonRetryableJobError(failure);
      }
      throw failure;
    }
  }
}

export { CreateImageThumbnailJobHandler };
