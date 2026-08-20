type SelectionRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  page: string;
};

type RelationshipSummaryRow = {
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

type RelationshipAnchorRow = {
  _id: string;
  reference: {
    selectionRectangles: readonly [SelectionRect];
  };
};

type RelationshipResolvedRow = {
  _id: string;
  reference: {
    text: string;
    selectionRectangles: SelectionRect[];
  };
};

type RelationshipHubRow = RelationshipSummaryRow & {
  reference?: {
    text?: string;
    selectionRectangles?: ReadonlyArray<SelectionRect>;
  };
};

type RelationshipQueryPayload = {
  language: string;
  sharedId: string;
  fileId?: string;
  hubRows: RelationshipHubRow[];
  anchorsLoaded: boolean;
};

export type {
  SelectionRect,
  RelationshipSummaryRow,
  RelationshipAnchorRow,
  RelationshipResolvedRow,
  RelationshipHubRow,
  RelationshipQueryPayload,
};
