import { ObjectId } from 'mongodb';
import { EntityStatus } from '../domain/PXEntityStatusModel';

export type MongoPXEntityStatus = {
  _id: ObjectId;
  entitySharedId: string;
  extractorId: ObjectId;

  status: EntityStatus;
  paragraphsCount: number;
  failedParagraphsCount: number;
  successfulParagraphsCount: number;
};
