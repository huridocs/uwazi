import { SegmentationStatus } from '../../domain/SegmentationStatus.js';
import { SegmentType } from '../../domain/SegmentType.js';

type LayoutPageReadModel = {
  number: number;
  width: number;
  height: number;
};

type LayoutSegmentReadModel = {
  left: number;
  top: number;
  width: number;
  height: number;
  pageNumber: number;
  text: string;
  type: SegmentType;
};

type SegmentationReadModel = {
  fileId: string;
  filename: string;
  xmlFilename: string;
  layout: {
    pages: LayoutPageReadModel[];
    segments: LayoutSegmentReadModel[];
  };
};

type SegmentationStatusReadModel = {
  fileId: string;
  status: SegmentationStatus;
};

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

export type {
  SegmentationDirectory,
  LayoutPageReadModel,
  LayoutSegmentReadModel,
  SegmentationReadModel,
  SegmentationStatusReadModel,
};
