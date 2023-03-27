import { TraverseQuery } from 'shared/types/api.v2/templates.createTemplateRequest';
import { PropertySchema } from 'shared/types/commonTypes';
import { TemplateSchema } from 'shared/types/templateType';

export interface RelationshipPropertyDBO {
  type: 'newRelationship';
  name: string;
  label: string;
  query: TraverseQuery[];
  denormalizedProperty?: string;
}
export interface TemplateDBO extends Omit<TemplateSchema, 'properties'> {
  properties: (PropertySchema | RelationshipPropertyDBO)[];
}
