import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibraryClickModifiers } from '../../librarySelection.js';
import type { LibrarySortOrder } from '../../libraryUrlState.js';
import type { ThumbFrame, ThumbSize } from '../libraryCardDisplay.js';
import type { LibraryTableColumnDef, LibraryTableDensity } from '../libraryTableColumns.js';

type LibraryViewerProps = {
  rows: LibrarySearchHit[];
  totalRows: number;
  selectedIds?: readonly string[];
  onSelect: (sharedId: string, modifiers?: LibraryClickModifiers) => void;
  onSelectCluster?: (sharedIds: string[], modifiers?: LibraryClickModifiers) => void;
  entityBasePath: string;
  onLoadMore: (amount: number) => void;
  showThumbnail: boolean;
  showMetadata: boolean;
  aggregations?: LibraryAggregations;
  sort?: string;
  order?: LibrarySortOrder;
  onSortChange?: (sort: string, order: LibrarySortOrder) => void;
  onFocusProperty?: (sharedId: string, fieldKey: string) => void;
  tableColumns?: LibraryTableColumnDef[];
  tableDensity?: LibraryTableDensity;
  thumbFrame?: ThumbFrame;
  thumbSize?: ThumbSize;
};

export type { LibraryViewerProps };
