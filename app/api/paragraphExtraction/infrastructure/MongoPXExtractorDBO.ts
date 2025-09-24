import { ObjectId } from 'mongodb';

// @ts-expect-error TS(2307): Cannot find module '../templates.v2/database/schem... Remove this comment to see the full error message
import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO.js';

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
