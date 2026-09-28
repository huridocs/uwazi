import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SegmentationScheduler } from '../../application/SegmentationScheduler.js';
import { SegmentationJobsAdapter } from '../jobs/SegmentationJobsAdapter.js';
import { SegmentationDataSourceFactory } from './SegmentationDataSourceFactory.js';

class SegmentationSchedulerFactory {
  static default(): SegmentationScheduler {
    return new SegmentationScheduler({
      segmentationDS: SegmentationDataSourceFactory.default(),
      jobs: new SegmentationJobsAdapter(ExecutionContext.jobsDispatcher),
    });
  }
}

export { SegmentationSchedulerFactory };
