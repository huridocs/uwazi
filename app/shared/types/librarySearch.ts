import type { EntitySchema } from '#shared/types/entityType.js';

type LibraryPublishedStatus = 'published' | 'restricted' | 'all';
type LibrarySortOrder = 'asc' | 'desc';

type LibraryPermissionLevel = 'read' | 'write';

type LibraryPermissionPick = {
  refId: string;
  level: LibraryPermissionLevel;
};

type LibraryPermissionBucket = {
  id: string;
  label?: string;
  count: number;
  group: boolean;
};

type LibraryPermissionAggregations = {
  read: LibraryPermissionBucket[];
  write: LibraryPermissionBucket[];
};

type LibrarySearchQuery = {
  searchTerm?: string;
  templateIds?: string[];
  filters?: Record<string, string[]>;
  /** Property names that use AND (must match all values). Same as V1 `filters[name].and`. */
  andFilters?: string[];
  /** Users and groups a record is shared with. Sent as `customFilters.permissions`. */
  permissionFilters?: LibraryPermissionPick[];
  /** One AND for both Can view and Can edit. OR is the default. */
  permissionsAnd?: boolean;
  /** Ask `/api/search` for `_permissions.read` and `_permissions.write`. Admins only. */
  aggregatePermissionsByUsers?: boolean;
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
  permissions?: LibraryPermissionAggregations;
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
  LibraryPermissionAggregations,
  LibraryPermissionBucket,
  LibraryPermissionLevel,
  LibraryPermissionPick,
  LibraryHitSnippets,
  LibraryPublishedStatus,
  LibrarySearchHit,
  LibrarySearchQuery,
  LibrarySearchResult,
  LibrarySnippetFullText,
  LibrarySnippetMetadata,
  LibrarySortOrder,
};
