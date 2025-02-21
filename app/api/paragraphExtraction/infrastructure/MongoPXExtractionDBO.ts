import { ObjectId } from 'mongodb';

export type MongoPXExtractionDBO = {
  _id: ObjectId;
  sourceEntityId: string;
  userId: ObjectId;
  extractorId: ObjectId;
  status: string;
  tenantName: string;
};
