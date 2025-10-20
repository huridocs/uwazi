import { ObjectId } from 'mongodb';

import { TemplateDBO } from 'api/core/infrastructure/mongodb/template/DBOs/TemplateDBO';

export type MongoPXExtractorDBO = {
  _id: ObjectId;
  sourceTemplateId: ObjectId;
  targetTemplateId: ObjectId;
  paragraphNumberPropertyId: ObjectId;
  paragraphPropertyId: ObjectId;
  sourceRelationshipTypeId: ObjectId;
  targetRelationshipTypeId: ObjectId;
};

export type MongoPXDenormalizedExtractorDBO = {
  targetTemplate: TemplateDBO;
  sourceTemplate: TemplateDBO;
} & Omit<MongoPXExtractorDBO, 'targetTemplateId' | 'sourceTemplateId'>;
