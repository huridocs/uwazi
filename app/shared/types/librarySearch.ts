import type { EntitySchema } from '#shared/types/entityType.js';

type LibraryPublishedStatus = 'published' | 'restricted' | 'all';
type LibrarySortOrder = 'asc' | 'desc';

type LibrarySearchQuery = {
  searchTerm?: string;
  templateIds?: string[];
  filters?: Record<string, string[]>;
  /** Property names that use AND (must match all values). Same as V1 `filters[name].and`. */
  andFilters?: string[];
  publishedStatus?: LibraryPublishedStatus;
  from?: number;
  limit?: number;
  sort?: string;
  order?: LibrarySortOrder;
  /** Restrict `_source` fields on GET /api/search. */
  fields?: string[];
  /** When `fields` is set, also request documents and attachments. */
  includeFiles?: boolean;
  /** Geo-only projection used by the library map (GET /api/search?geolocation=true). */
  geolocation?: boolean;
};

type LibraryFacetIcon = {
  _id: string;
  type?: string;
  label?: string;
};

type LibraryFacetBucket = {
  id: string;
  label?: string;
  count: number;
  icon?: LibraryFacetIcon;
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

type LibrarySnippetMetadata = {
  field: string;
  texts: string[];
};

type LibrarySnippetFullText = {
  text: string;
  page: number;
};

/** Highlight fragments `/api/search` already attaches via `snippetsFromSearchHit`. */
type LibraryHitSnippets = {
  count: number;
  metadata: LibrarySnippetMetadata[];
  fullText: LibrarySnippetFullText[];
};

type LibrarySearchHit = {
  _id: string;
  sharedId: string;
  title: string;
  template: string;
  language: string;
  creationDate?: number;
  editDate?: number;
  published?: boolean;
  metadata?: Record<string, unknown>;
  documents?: unknown[];
  icon?: EntitySchema['icon'];
  snippets?: LibraryHitSnippets;
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
  LibraryFacetIcon,
  LibraryHitSnippets,
  LibraryPublishedStatus,
  LibrarySearchHit,
  LibrarySearchQuery,
  LibrarySearchResult,
  LibrarySnippetFullText,
  LibrarySnippetMetadata,
  LibrarySortOrder,
};
