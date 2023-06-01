export type Filter = never;

export interface MatchQuery {
  templates: string[];
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
