/** Work the module hands to the job queue. */
interface SegmentationJobs {
  /** One job per segmentation, each sending it to the segmentation service. */
  requestSegmentation(segmentationIds: string[]): Promise<void>;
}

export type { SegmentationJobs };
