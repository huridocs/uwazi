/** Work the module hands to the job queue. */
interface SegmentationJobs {
  /**
   * One job per segmentation, each sending it to the segmentation service; with `delayMs`, not
   * before that much time has passed.
   */
  requestSegmentation(segmentationIds: string[], options?: { delayMs?: number }): Promise<void>;
}

export type { SegmentationJobs };
