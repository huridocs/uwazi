interface NodeQuery {
  traverse?: EdgeQuery[];
}

export interface RootNodeQuery extends NodeQuery {
  sharedId: string;
}

export interface InternalNodeQuery extends NodeQuery {
  templates?: string[];
}

export interface EdgeQuery {
  direction: 'in' | 'out';
  types?: string[];
  match: InternalNodeQuery[];
}

export type RelationshipsQuery = RootNodeQuery;
