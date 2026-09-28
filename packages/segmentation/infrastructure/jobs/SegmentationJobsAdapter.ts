import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { SegmentationJobs } from '../../application/contracts/SegmentationJobs.js';
import { RequestSegmentationJobHandler } from './RequestSegmentationJobHandler.js';

class SegmentationJobsAdapter implements SegmentationJobs {
  constructor(private readonly jobsDispatcher: JobsDispatcher) {}

  async requestSegmentation(
    segmentationIds: string[],
    { delayMs }: { delayMs?: number } = {}
  ): Promise<void> {
    if (!segmentationIds.length) {
      return;
    }
    const options = delayMs ? { lockedUntil: Date.now() + delayMs } : undefined;
    await this.jobsDispatcher.dispatchMany(dispatch => {
      segmentationIds.forEach(segmentationId =>
        dispatch(RequestSegmentationJobHandler, { segmentationId }, options)
      );
    });
  }
}

export { SegmentationJobsAdapter };
