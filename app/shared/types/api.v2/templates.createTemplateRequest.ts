export type Filter = AndFilter | TemplateFilter | SelectFilter | VoidFilter;
export interface AndFilter {
  type: 'and';
  value: Filter[];
}

export interface TemplateFilter {
  type: 'template';
  value: string[];
}

export interface SelectFilter {
  type: 'select';
  property: string;
  value: string[];
}

export interface VoidFilter {
  type: 'void';
}

export interface MatchQuery {
  filter: Filter;
  traverse?: TraverseQuery[];
}

export interface TraverseQuery {
  direction: 'in' | 'out';
  types: string[];
  match: MatchQuery[];
}

export interface RelationshipPropertyData {
  _id?: string;
  type: 'newRelationship';
  label: string;
  name: string;
  query: TraverseQuery[];
  denormalizedProperty?: string;
  noLabel?: boolean;
  required?: boolean;
  showInCard?: boolean;
  filter?: boolean;
  defaultfilter?: boolean;
}
