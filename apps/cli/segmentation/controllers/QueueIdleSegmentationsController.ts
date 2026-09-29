import { SegmentationComposition } from '#segmentation/composition';
import type { QueueIdleSegmentationsOutput } from '../contracts.js';

const BATCH_SIZE = 200;

/**
 * Requests the tenant's idle segmentations, when it has segmentation on: those registered while
 * it was off, and those the upgrade migrations registered for existing documents.
 */
class QueueIdleSegmentationsController {
  static async handle(): Promise<QueueIdleSegmentationsOutput> {
    return SegmentationComposition.queueIdleSegmentations().execute({
      batchSize: BATCH_SIZE,
      heartbeat: async () => {},
    });
  }
}

export { QueueIdleSegmentationsController };
