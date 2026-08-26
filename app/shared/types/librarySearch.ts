type LibraryPublishedStatus = 'published' | 'restricted' | 'all';
type LibrarySortOrder = 'asc' | 'desc';

type LibrarySearchQuery = {
  searchTerm?: string;
  templateIds?: string[];
  filters?: Record<string, string[]>;
  publishedStatus?: LibraryPublishedStatus;
  from?: number;
  limit?: number;
  sort?: string;
  order?: LibrarySortOrder;
};

type LibraryFacetBucket = {
  id: string;
  label?: string;
  count: number;
  values?: LibraryFacetBucket[];
};

type LibraryAggregations = {
  templates: LibraryFacetBucket[];
  published: {
    published: number;
    restricted: number;
  };
  properties: Record<string, LibraryFacetBucket[]>;
};

type LibrarySearchHit = {
  _id: string;
  sharedId: string;
  title: string;
  template: string;
  language: string;
  creationDate?: number;
  published?: boolean;
  metadata?: Record<string, unknown>;
  documents?: unknown[];
  icon?: unknown;
  [key: string]: unknown;
};

type LibrarySearchResult = {
  rows: LibrarySearchHit[];
  totalRows: number;
  aggregations: LibraryAggregations;
};

export type {
  LibraryAggregations,
  LibraryFacetBucket,
  LibraryPublishedStatus,
  LibrarySearchHit,
  LibrarySearchQuery,
  LibrarySearchResult,
  LibrarySortOrder,
};
