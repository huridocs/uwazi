type SelectionRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  page: string;
};

type RelationshipSummary = {
  _id: string;
  hub: string;
  entity: string;
  template: string | null;
  file?: string;
  entityData: {
    title: string;
    template: string;
  };
};

type RelationshipAnchor = {
  _id: string;
  reference: {
    selectionRectangles: readonly [SelectionRect];
  };
};

type RelationshipResolved = {
  _id: string;
  reference: {
    text: string;
    selectionRectangles: SelectionRect[];
  };
};

type GetRelationshipsSummaryRequest = { sharedId: string };

/**
 * Missing or unreadable sources return the same 200 `{ rows: [] }` as an empty graph.
 * Status is intentionally not used to distinguish those cases (no existence leak; empty UI).
 */
type GetRelationshipsSummaryResponse = { rows: RelationshipSummary[] };

type GetRelationshipsAnchorsRequest = { sharedId: string; file: string };
type GetRelationshipsAnchorsResponse = { rows: RelationshipAnchor[] };

type GetRelationshipsResolvedRequest = { sharedId: string };
type GetRelationshipsResolvedResponse = { rows: RelationshipResolved[] };

export type {
  SelectionRect,
  RelationshipSummary,
  RelationshipAnchor,
  RelationshipResolved,
  GetRelationshipsSummaryRequest,
  GetRelationshipsSummaryResponse,
  GetRelationshipsAnchorsRequest,
  GetRelationshipsAnchorsResponse,
  GetRelationshipsResolvedRequest,
  GetRelationshipsResolvedResponse,
};
