import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SegmentationJobsAdapter } from '../jobs/SegmentationJobsAdapter.js';
import { SegmentationResultListener } from '../layoutAnalysisService/SegmentationResultListener.js';

class SegmentationResultListenerFactory {
  /** Each outcome becomes a SaveSegmentationResult job in its tenant's queue. */
  static default(): SegmentationResultListener {
    return new SegmentationResultListener({
      saveResult: async outcome =>
        new SegmentationJobsAdapter(ExecutionContext.jobsDispatcher).saveResult(outcome),
    });
  }
}

export { SegmentationResultListenerFactory };
