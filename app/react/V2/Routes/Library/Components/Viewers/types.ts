import type { LibraryAggregations, LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { LibrarySortOrder } from '../../libraryUrlState.js';
import type { ThumbFrame } from '../libraryCardDisplay.js';
import type { LibraryTableColumnDef, LibraryTableDensity } from '../libraryTableColumns.js';

type LibraryViewerProps = {
  rows: LibrarySearchHit[];
  totalRows: number;
  selectedId?: string;
  onSelect: (sharedId: string) => void;
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
};

export type { LibraryViewerProps };
