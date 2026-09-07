import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import type { EntityCardLayout } from '../EntityCard.js';

type LibraryViewerProps = {
  rows: LibrarySearchHit[];
  totalRows: number;
  selectedId?: string;
  onSelect: (sharedId: string) => void;
  entityBasePath: string;
  onLoadMore: (amount: number) => void;
  showThumbnail: boolean;
  showMetadata: boolean;
  layout: EntityCardLayout;
};

export type { LibraryViewerProps };
