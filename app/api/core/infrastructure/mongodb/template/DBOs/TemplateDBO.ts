import { ObjectId } from 'mongodb';
import { PropertySchema } from '#shared/types/commonTypes.js';
import { TemplateSchema } from '#shared/types/templateType.js';
import { TraverseQueryDBO } from './RelationshipsQueryDBO.js';

export interface RelationshipPropertyDBO {
  _id: ObjectId;
  type: 'newRelationship';
  name: string;
  label: string;
  query: TraverseQueryDBO[];
  denormalizedProperty?: string;
}

export interface TemplateDBO extends TemplateSchema {
  _id: ObjectId;
  properties: (PropertySchema | RelationshipPropertyDBO)[];
  commonProperties: [PropertySchema, ...PropertySchema[]];
}
