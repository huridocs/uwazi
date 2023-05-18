export interface MatchQueryInputType {
  templates: string[];
  traverse?: TraverseInputType;
}

export type TraverseInputType = TraverseQueryInputType[] | undefined;

export interface TraverseQueryInputType {
  direction: 'in' | 'out';
  types: string[];
  match: MatchQueryInputType[];
}
