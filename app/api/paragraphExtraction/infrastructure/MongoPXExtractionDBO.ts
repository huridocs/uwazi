import { ObjectId } from 'mongodb';

export type MongoPXExtractionDBO = {
  _id: ObjectId;
  sourceEntityId: string;
  extractorId: ObjectId;
  status: string;
};
