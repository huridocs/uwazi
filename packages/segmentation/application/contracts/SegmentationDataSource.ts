import { Segmentation } from '../../domain/Segmentation.js';

interface SegmentationDataSource {
  /** Stores a new segmentation; returns false, storing nothing, when its file already has one. */
  create(segmentation: Segmentation): Promise<boolean>;

  getById(id: string): Promise<Segmentation | undefined>;

  getByFileId(fileId: string): Promise<Segmentation | undefined>;

  /** The file name the segmentation service knows it by. */
  getByFilename(filename: string): Promise<Segmentation | undefined>;

  /** Updates a stored segmentation. One deleted in the meantime stays deleted. */
  save(segmentation: Segmentation): Promise<void>;

  /** Idle segmentations in id order, after `afterId` when given. */
  nextIdleBatch(limit: number, afterId?: string): Promise<Segmentation[]>;

  /** Processing segmentations requested before `requestedBefore`. */
  staleProcessing(requestedBefore: number, limit: number): Promise<Segmentation[]>;

  /** Deletes the segmentations of the files and returns what was deleted. */
  deleteByFileIds(fileIds: string[]): Promise<Segmentation[]>;
}

export type { SegmentationDataSource };
