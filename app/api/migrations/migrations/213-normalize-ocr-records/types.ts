import { ObjectId } from 'mongodb';

/** An `ocr_records` document as this migration finds it: any shape the old or new code wrote. */
interface OcrRecordDoc {
  _id: ObjectId;
  sourceFile?: ObjectId | null;
  resultFile?: ObjectId | null;
  filename?: string;
  language?: string;
  status?: string;
  attempt?: number;
  requestedAt?: number;
  lastUpdated?: number;
  failureReason?: string;
  sessionId?: string;
}

interface FileDoc {
  _id: ObjectId;
  filename?: string;
  language?: string;
}

interface Fixture {
  ocr_records: OcrRecordDoc[];
  files: FileDoc[];
}

export type { OcrRecordDoc, FileDoc, Fixture };
