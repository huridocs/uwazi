import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO';
import { ObjectId } from 'mongodb';

export type MongoPXExtractorDBO = {
  _id: ObjectId;
  targetTemplateId: ObjectId;
  sourceTemplateId: ObjectId;
  paragraphPropertyId: ObjectId;
  paragraphNumberPropertyId: ObjectId;
};

export type MongoPXDenormalizedExtractorDBO = {
  targetTemplate: TemplateDBO;
  sourceTemplate: TemplateDBO;
} & Omit<MongoPXExtractorDBO, 'targetTemplateId' | 'sourceTemplateId'>;
