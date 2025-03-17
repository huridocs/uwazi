import { ObjectId } from 'mongodb';
import { ExtractionStatus } from '../domain/PXExtraction';

export type MongoPXEntityStatus = {
  _id: ObjectId;
  entitySharedId: string;
  extractorId: ObjectId;

  status: ExtractionStatus;
  paragraphsCount: number;
  failedParagraphsCount: number;
  successfulParagraphsCount: number;
};
