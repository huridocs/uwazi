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
  label: string;
  name: string;
  query: TraverseQuery[];
  denormalizedProperty?: string;
}
