import { JobsDispatcher } from '#api/core/libs/queue/application/contracts/JobsDispatcher.js';
import { SegmentationJobs } from '../../application/contracts/SegmentationJobs.js';
import { SegmentationOutcome } from '../../application/contracts/PdfSegmenter.js';
// eslint-disable-next-line import/no-cycle
import { RequestSegmentationJobHandler } from './RequestSegmentationJobHandler.js';
// eslint-disable-next-line import/no-cycle
import { SaveSegmentationResultJobHandler } from './SaveSegmentationResultJobHandler.js';
import { SegmentationOutcomeParams } from './SegmentationOutcomeParams.js';

class SegmentationJobsAdapter implements SegmentationJobs {
  constructor(private readonly deps: { jobsDispatcher: JobsDispatcher }) {}

  async requestSegmentation(
    segmentationIds: string[],
    { delayMs }: { delayMs?: number } = {}
  ): Promise<void> {
    if (!segmentationIds.length) {
      return;
    }
    const options = delayMs ? { lockedUntil: Date.now() + delayMs } : undefined;
    await this.deps.jobsDispatcher.dispatchMany(dispatch => {
      segmentationIds.forEach(segmentationId =>
        dispatch(RequestSegmentationJobHandler, { segmentationId }, options)
      );
    });
  }

  /** Used by the result listener, which is outside the application layer. */
  async saveResult(outcome: SegmentationOutcome): Promise<void> {
    await this.deps.jobsDispatcher.dispatch(
      SaveSegmentationResultJobHandler,
      SegmentationOutcomeParams.from(outcome)
    );
  }
}

export { SegmentationJobsAdapter };
