import type {
  RelationshipAnchor,
  RelationshipResolved,
  RelationshipSummary,
  SelectionRect,
} from '#shared/contracts/Relationships.js';

type RelationshipHubRow = RelationshipSummary & {
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
  seedRevision?: number;
};

export type {
  SelectionRect,
  RelationshipSummary,
  RelationshipAnchor,
  RelationshipResolved,
  RelationshipHubRow,
  RelationshipQueryPayload,
};
