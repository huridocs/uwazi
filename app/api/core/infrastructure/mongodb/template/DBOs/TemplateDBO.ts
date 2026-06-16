import { ObjectId } from 'mongodb';
import { PropertySchema } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { TraverseQueryDBO } from './RelationshipsQueryDBO.js';

export interface RelationshipPropertyDBO extends PropertySchema {
  type: 'newRelationship';
  query: TraverseQueryDBO[];
  denormalizedProperty?: string;
}

export interface TemplateDBO extends TemplateSchema {
  _id: ObjectId;
  properties: PropertySchema[];
  commonProperties: [PropertySchema, ...PropertySchema[]];
}
