import type { SelectionRect } from '#shared/contracts/Relationships.js';

export type PostgresRelationshipRow = {
  _id: string;
  entity: string | null;
  hub: string | null;
  template: string | null;
  file: string | null;
  metadata: Record<string, unknown>;
  reference: {
    text: string;
    selectionRectangles?: SelectionRect[];
  } | null;
  sharedId: string | null;
  filename: string | null;
  range: unknown | null;
};
