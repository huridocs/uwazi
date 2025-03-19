import { ObjectId } from 'mongodb';

import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO';

export type MongoPXExtractorDBO = {
  _id: ObjectId;
  targetTemplateId: ObjectId;
  sourceTemplateId: ObjectId;
  paragraphPropertyId: ObjectId;
  paragraphNumberPropertyId: ObjectId;
  sourceRelationshipTypeId: ObjectId;
  targetRelationshipTypeId: ObjectId;
};

export type MongoPXDenormalizedExtractorDBO = {
  targetTemplate: TemplateDBO;
  sourceTemplate: TemplateDBO;
} & Omit<MongoPXExtractorDBO, 'targetTemplateId' | 'sourceTemplateId'>;
