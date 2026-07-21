import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { TocSchema } from '#shared/types/commonTypes.js';
import type { RelationshipsPanelGroupBy } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';

type RelationshipsPanelView = 'list' | 'tree' | 'graph';
type RelationshipsPanelZoom = 'detail' | 'compact' | 'overview';

type TocState = {
  toc: TocSchema[] | undefined;
  isEditMode: boolean;
  expanded: Record<number, boolean>;
  isAllExpanded: boolean;
  isAllCollapsed: boolean;
  isSaving: boolean;
};

export type {
  RelationshipsPanelView,
  RelationshipsPanelZoom,
  RelationshipsPanelSort,
  RelationshipsPanelGroupBy,
  TocState,
  TextSelection,
};
