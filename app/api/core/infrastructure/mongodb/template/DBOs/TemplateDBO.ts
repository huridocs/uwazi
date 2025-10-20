import { ObjectId } from 'mongodb';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';
import { TraverseQueryDBO } from './RelationshipsQueryDBO';

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
