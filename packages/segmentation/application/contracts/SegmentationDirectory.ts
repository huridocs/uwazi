import { SegmentationReadModel, SegmentationStatusReadModel } from './SegmentationReadModels.js';

//cc: let's colocate the methods types in this file, reducing amount of files.

/** What the segmentation module exposes to other modules. */
interface SegmentationDirectory {
  readyByFileIds(fileIds: string[]): Promise<SegmentationReadModel[]>;

  readyByFilenames(filenames: string[]): Promise<SegmentationReadModel[]>;

  /** The file an xml was produced for, whatever the segmentation's status. */
  fileIdForXml(xmlFilename: string): Promise<string | undefined>;

  readyFileIds(): Promise<string[]>;

  /** One entry per file that has a segmentation; files without one are left out. */
  statusesByFileIds(fileIds: string[]): Promise<SegmentationStatusReadModel[]>;
}

export type { SegmentationDirectory };
