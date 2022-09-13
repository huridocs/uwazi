interface NodeQuery {
  traverse?: EdgeQuery[];
}

export interface RootNodeQuery extends NodeQuery {
  sharedId: string;
}

export interface InternalNodeQuery extends NodeQuery {
  //
}

export interface EdgeQuery {
  direction: 'in' | 'out';
  match: InternalNodeQuery[];
}

export type RelationshipsQuery = RootNodeQuery;
