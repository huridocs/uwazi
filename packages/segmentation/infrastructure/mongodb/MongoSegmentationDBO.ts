import { ObjectId } from 'mongodb';

type MongoParagraphDBO = {
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  page_number?: number;
  page_width?: number;
  page_height?: number;
  text?: string;
  type?: string;
};

/**
 * A `segmentations` document. The layout keeps the shape the old pipeline wrote — snake_case,
 * one document-wide page size, the service's segment type names — so records from before this
 * module and readers not yet moved to the directory keep working. Page sizes are kept per
 * paragraph as well; the document-wide one is the first page's.
 */
type MongoSegmentationDBO = {
  _id: ObjectId;
  fileID: ObjectId;
  filename: string;
  status: string;
  attempt?: number;
  requestedAt?: number;
  xmlname?: string;
  failureReason?: string;
  segmentation?: {
    page_width?: number;
    page_height?: number;
    paragraphs?: MongoParagraphDBO[];
  };
};

export type { MongoSegmentationDBO, MongoParagraphDBO };
