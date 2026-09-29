import type { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { SelectionRect } from './Relationships.js';

/**
 * Backend-agnostic persistence contract for the V1 relationships module
 * (`app/api/relationships/`). Implementations live per backend (Mongo and
 * Postgres); the V1 module and the core services consume this contract through
 * `RelationshipsV1DataSourceFactory`.
 *
 * No Mongo-specific vocabulary leaks here: id values are either plain strings
 * (read models) or `ObjectIdLike` (V1-facing rows, so `.equals()` / `.toString()`
 * keep working for the legacy public API).
 */

export type ObjectIdLike = {
  toString(): string;
  equals(other: unknown): boolean;
};

export type RelationshipReference = {
  text: string;
  selectionRectangles?: SelectionRect[];
};

/**
 * A `connections` row in the V1 public shape. `_id` / `hub` / `template` /
 * `sharedId` keep `ObjectIdLike` semantics so legacy callers can call
 * `.toString()` and `.equals()` on them.
 */
export type V1Relationship = {
  _id: ObjectIdLike;
  hub: ObjectIdLike;
  entity: string;
  template: ObjectIdLike | null;
  file?: string;
  metadata?: Record<string, unknown>;
  reference?: RelationshipReference;
  filename?: string;
  sharedId?: ObjectIdLike;
  [key: string]: unknown;
};

/** Read model used by the relationships query service (string ids). */
export type HubConnection = {
  _id: string;
  hub: string;
  entity: string;
  template: string | null;
  file?: string;
  reference?: RelationshipReference;
  filename?: string;
  sharedId?: string;
};

/** A relationship with its connected entity attached (core read model). */
export type Relation = {
  hub: { toString(): string };
  entity: string;
  template: { toString(): string } | null;
  entityData: {
    template: { toString(): string };
    title: string;
  };
};

/**
 * Plain, backend-agnostic query shape. Array values are IN-membership checks,
 * `null` (only valid for nullable columns like `template`) means IS NULL.
 */
export type RelationshipQuery = {
  _id?: string | string[];
  hub?: string | string[];
  entity?: string | string[];
  template?: string | string[] | null;
  file?: string | string[];
  sharedId?: string | string[];
  filename?: string;
};

/** `set`/`rename`/`unset` — never Mongo `$` operators. */
export type RelationshipUpdate = {
  set?: Record<string, unknown>;
  rename?: Record<string, string>;
  unset?: string[];
};

export type DeleteResult = {
  acknowledged?: boolean;
  deletedCount?: number;
};

export type FindOptions = {
  limit?: number;
};

export type HubConnectionsOptions = {
  /** Restrict own-side rows to a file (text references), `false` when no file filter. */
  file?: string;
  /** Only own-side rows that carry a file reference matching `file`. */
  onlyTextReferences?: boolean;
};

/** Minimal structural type for the domain `Entity` used by metadata reads. */
export type RelationshipSourceEntity = {
  sharedId: string;
  getReferencedRelationshipEntitySharedIds(language: LanguageISO6391): Set<string>;
};

export type EntityReferenceByRelationshipType = {
  hub: string;
  rightSide: {
    _id: string;
    entity: string;
    template: string | null;
    entityData: { template: string }[];
  };
};

export type RelationshipPropertyHubCandidate = {
  _id: string;
  templates: string[];
};

export type SearchHub = {
  hub: string;
  connections: V1Relationship[];
};

export interface RelationshipsV1DataSource {
  /** Generic reads. */
  find(query?: RelationshipQuery, options?: FindOptions): Promise<V1Relationship[]>;
  findById(id: string): Promise<V1Relationship | null>;
  count(query?: RelationshipQuery): Promise<number>;

  /**
   * All connections of the hubs that contain any of `entitiesSharedIds`, applying the
   * same own-side file filter as the V1 `getDocumentHubs` helper.
   */
  getHubConnections(
    entitiesSharedIds: string[],
    options?: HubConnectionsOptions
  ): Promise<V1Relationship[]>;

  /** Generic writes. */
  saveMultiple(documents: Partial<V1Relationship>[]): Promise<V1Relationship[]>;
  delete(query: RelationshipQuery): Promise<DeleteResult>;
  updateMany(query: RelationshipQuery, update: RelationshipUpdate): Promise<void>;

  /** Core-service read models. */
  getHubConnectionsForEntity(sharedId: string): Promise<HubConnection[]>;
  getByEntitySharedIds(sharedIds: string[]): Promise<Relation[]>;
  getByEntity(
    sharedId: string,
    language: LanguageISO6391,
    includeUnpublished: boolean
  ): Promise<Relation[]>;
  getEntityMetadataRelationships(
    entity: RelationshipSourceEntity,
    language: LanguageISO6391,
    includeUnpublished: boolean
  ): Promise<Relation[]>;

  /** Core-service writes. */
  deleteByFiles(fileIds: string[]): Promise<void>;
  bulkDeleteBySharedId(sharedIds: string[]): Promise<void>;

  /** Aggregation helpers replacing V1 `model.db.aggregate` pipelines. */
  getEntityReferencesByRelationshipTypes(
    sharedId: string,
    relationTypes: string[]
  ): Promise<Record<string, Record<string, EntityReferenceByRelationshipType>>>;
  guessRelationshipPropertyHub(
    sharedId: string,
    relationType: string
  ): Promise<RelationshipPropertyHubCandidate[]>;
  getRightSideConnections(
    entitySharedId: string,
    relationTypeFilter: (string | null)[]
  ): Promise<V1Relationship[]>;
  getMatchingHubsCount(
    entitySharedId: string,
    searchResultIds: string[],
    filteredConnectionIds: string[]
  ): Promise<number>;
  getHubsForSearch(
    entitySharedId: string,
    filteredConnectionIds: string[],
    filteredSharedIds: string[],
    limit: number
  ): Promise<SearchHub[]>;
  getEntitiesAffectedByHubs(hubIds: string[]): Promise<string[]>;
  getHubsToDelete(hubIds: string[]): Promise<string[]>;
}
