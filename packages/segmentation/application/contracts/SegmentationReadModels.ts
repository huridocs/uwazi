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

export type {
  LayoutPageReadModel,
  LayoutSegmentReadModel,
  SegmentationReadModel,
  SegmentationStatusReadModel,
};
