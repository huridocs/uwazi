import { ObjectId } from 'mongodb';

interface FileDoc {
  _id: ObjectId;
  filename?: string;
  type?: 'document' | 'attachment' | 'custom' | 'thumbnail';
  mimetype?: string;
}

interface SegmentationDoc {
  _id: ObjectId;
  fileID: ObjectId;
  filename: string;
  status: string;
  attempt: number;
}

interface Fixture {
  files: FileDoc[];
  segmentations: SegmentationDoc[];
}

export type { FileDoc, SegmentationDoc, Fixture };
