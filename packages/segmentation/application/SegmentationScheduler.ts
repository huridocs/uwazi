import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import { Segmentation } from '../domain/Segmentation.js';
import { SegmentationDataSource } from './contracts/SegmentationDataSource.js';
import { SegmentationJobs } from './contracts/SegmentationJobs.js';

type Deps = {
  segmentationDS: SegmentationDataSource;
  jobs: SegmentationJobs;
};

/**
 * Queues segmentations and requests them, inside the caller's transaction: a segmentation is
 * marked queued together with the dispatch of its request, or neither happens. Only idle ones
 * move, so scheduling the same segmentation twice requests it once.
 */
class SegmentationScheduler {
  constructor(private readonly deps: Deps) {}

  async schedule(segmentations: Segmentation[]): Promise<void> {
    const queued = segmentations.filter(segmentation => segmentation.queue());

    await ArrayUtils.sequentialFor(queued, async segmentation =>
      this.deps.segmentationDS.save(segmentation)
    );
    await this.deps.jobs.requestSegmentation(queued.map(segmentation => segmentation.id));
  }
}

export { SegmentationScheduler };
