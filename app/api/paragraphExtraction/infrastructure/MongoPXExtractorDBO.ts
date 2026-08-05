import { ObjectId } from 'mongodb';

export type MongoPXExtractorDBO = {
  _id: ObjectId;
  sourceTemplateId: ObjectId;
  targetTemplateId: ObjectId;
  paragraphNumberPropertyId: ObjectId;
  paragraphPropertyId: ObjectId;
  sourceRelationshipTypeId: ObjectId;
  targetRelationshipTypeId: ObjectId;
};
