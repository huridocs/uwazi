import { ObjectId } from 'mongodb';

/**
 * An `ocr_records` document, in the normalized shape the 213 migration leaves old documents in.
 * The field names are the ones the old pipeline wrote.
 */
type MongoOcrRecordDBO = {
  _id: ObjectId;
  sourceFile: ObjectId | null;
  resultFile?: ObjectId;
  filename: string;
  language: string;
  status: string;
  attempt: number;
  requestedAt?: number;
  lastUpdated: number;
  failureReason?: string;
};

export type { MongoOcrRecordDBO };
