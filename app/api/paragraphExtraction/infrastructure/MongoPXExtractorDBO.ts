import { ObjectId } from 'mongodb';

export type MongoPXExtractorDBO = {
  _id: ObjectId;
  targetTemplateId: ObjectId;
  sourceTemplateId: ObjectId;
  paragraphPropertyId: ObjectId;
  paragraphNumberPropertyId: ObjectId;
};
