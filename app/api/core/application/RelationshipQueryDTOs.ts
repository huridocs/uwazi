type SelectionRectDTO = {
  top: number;
  left: number;
  width: number;
  height: number;
  page: string;
};

type RelationshipSummaryDTO = {
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

type RelationshipAnchorDTO = {
  _id: string;
  reference: {
    selectionRectangles: readonly [SelectionRectDTO];
  };
};

type RelationshipResolvedDTO = {
  _id: string;
  reference: {
    text: string;
    selectionRectangles: SelectionRectDTO[];
  };
};

export type {
  SelectionRectDTO,
  RelationshipSummaryDTO,
  RelationshipAnchorDTO,
  RelationshipResolvedDTO,
};
