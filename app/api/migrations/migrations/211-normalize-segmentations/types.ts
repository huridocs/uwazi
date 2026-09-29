import { ObjectId } from 'mongodb';

/** A `segmentations` document as this migration finds it: any shape the old or new code wrote. */
interface SegmentationDoc {
  _id: ObjectId;
  fileID?: ObjectId | null;
  filename?: string | null;
  status?: string;
  attempt?: number;
  requestedAt?: number;
  xmlname?: string;
  autoexpire?: Date | null;
  segmentation?: unknown;
}

interface Fixture {
  segmentations: SegmentationDoc[];
}

export type { SegmentationDoc, Fixture };
