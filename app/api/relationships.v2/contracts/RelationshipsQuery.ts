interface NodeQuery {
  traverse?: EdgeQuery[];
}

export interface RootNodeQuery extends NodeQuery {
  templates?: string[];
  sharedId?: string;
}

export type InternalNodeQuery = RootNodeQuery;

export interface EdgeQuery {
  direction: 'in' | 'out';
  types?: string[];
  match: InternalNodeQuery[];
}

export type RelationshipsQuery = RootNodeQuery;
