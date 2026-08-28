import { SnippetsSearchResponse } from '#V2/api/types.js';
import { Entity, FileType } from '#V2/api/entities/types.js';
import type { RelationshipQueryPayload } from '#V2/api/relationships/types.js';
import { isClient } from '#app/utils/index.js';

type EntityCacheOptions = {
  requireRelationships?: boolean;
};

type RelationshipQueryCacheOptions = {
  requireAnchors?: boolean;
};

const entityIncludesRelationships = (entity: Entity): boolean => 'relations' in entity;

const mergeEntityCacheEntry = (existing: Entity, incoming: Entity): Entity =>
  entityIncludesRelationships(existing)
    ? { ...existing, ...incoming, relations: existing.relations }
    : incoming;

interface CachedItem<T> {
  data: T;
  timestamp: number;
}

const getCachedItem = <T>(
  cache: Map<string, CachedItem<T>>,
  key: string,
  ttl: number
): T | undefined => {
  const cached = cache.get(key);

  if (!cached) {
    return undefined;
  }

  const age = Date.now() - cached.timestamp;

  if (age > ttl) {
    cache.delete(key);
    return undefined;
  }

  return cached.data;
};

const setCachedItem = <T>(
  cache: Map<string, CachedItem<T>>,
  key: string,
  data: T,
  limit: number
): void => {
  cache.set(key, { data, timestamp: Date.now() });

  if (cache.size > limit) {
    const firstKey = cache.keys().next().value;
    if (firstKey) {
      cache.delete(firstKey);
    }
  }
};

const invalidateByPrefix = <T>(cache: Map<string, CachedItem<T>>, prefix: string): void => {
  Array.from(cache.keys())
    .filter(key => key.startsWith(prefix))
    .forEach(key => cache.delete(key));
};

class EntityLoaderCache {
  // Shared entity cache keyed by `${sharedId}:${language}` (5-minute TTL).
  // Loader and overlay read the same entry; loader requires `relations`, overlay does not.
  // Full fetches replace the entry; partial fetches merge metadata without dropping relations.
  private entityCache = new Map<string, CachedItem<Entity>>();

  private refetchSharedIds = new Set<string>();

  private mainDocumentCache = new Map<string, CachedItem<FileType>>();

  private plaintextCache = new Map<string, CachedItem<string>>();

  private searchResultsCache = new Map<string, CachedItem<SnippetsSearchResponse>>();

  private relationshipQueryCache = new Map<string, CachedItem<RelationshipQueryPayload>>();

  private relationshipSeedRevision = new Map<string, number>();

  private ttls = {
    entity: 5 * 60 * 1000,
    mainDocument: 5 * 60 * 1000,
    plaintext: 5 * 60 * 1000,
    searchResults: 5 * 60 * 1000,
    relationshipQuery: 5 * 60 * 1000,
  };

  private limits = {
    entity: 20,
    mainDocument: 20,
    plaintext: 20,
    searchResults: 20,
    relationshipQuery: 20,
  };

  private relationshipQueryKey(sharedId: string, language: string, fileId?: string): string {
    return `${sharedId}:${language}:${fileId ?? ''}`;
  }

  getRelationshipSeedRevision(sharedId: string): number {
    return this.relationshipSeedRevision.get(sharedId) ?? 0;
  }

  private bumpRelationshipSeedRevision(sharedId: string): void {
    this.relationshipSeedRevision.set(sharedId, this.getRelationshipSeedRevision(sharedId) + 1);
  }

  getEntity(
    sharedId: string,
    language: string,
    { requireRelationships = false }: EntityCacheOptions = {}
  ): Entity | undefined {
    if (!isClient) {
      return undefined;
    }

    const key = `${sharedId}:${language}`;
    const entity = getCachedItem(this.entityCache, key, this.ttls.entity);

    if (!entity?._id) {
      return undefined;
    }

    if (
      requireRelationships &&
      (this.refetchSharedIds.has(sharedId) || !entityIncludesRelationships(entity))
    ) {
      return undefined;
    }

    return entity;
  }

  setEntity(sharedId: string, language: string, data: Entity): void {
    if (!isClient || !data._id) {
      return;
    }

    const key = `${sharedId}:${language}`;
    const existing = getCachedItem(this.entityCache, key, this.ttls.entity);
    const next =
      entityIncludesRelationships(data) || !existing ? data : mergeEntityCacheEntry(existing, data);

    setCachedItem(this.entityCache, key, next, this.limits.entity);
    if (entityIncludesRelationships(data)) {
      this.refetchSharedIds.delete(sharedId);
    }
  }

  isRefetchPending(sharedId: string): boolean {
    return this.refetchSharedIds.has(sharedId);
  }

  invalidateEntity(sharedId: string): void {
    invalidateByPrefix(this.entityCache, `${sharedId}:`);
    invalidateByPrefix(this.mainDocumentCache, `${sharedId}:`);
    this.bumpRelationshipSeedRevision(sharedId);
    this.invalidateRelationshipQuery(sharedId);
    this.invalidateSearchResults(sharedId);
    this.refetchSharedIds.add(sharedId);
  }

  getRelationshipQuery(
    sharedId: string,
    language: string,
    fileId?: string,
    { requireAnchors = false }: RelationshipQueryCacheOptions = {}
  ): RelationshipQueryPayload | undefined {
    if (!isClient) {
      return undefined;
    }

    const cached = getCachedItem(
      this.relationshipQueryCache,
      this.relationshipQueryKey(sharedId, language, fileId),
      this.ttls.relationshipQuery
    );

    if (!cached) {
      return undefined;
    }

    if (requireAnchors && !cached.anchorsLoaded) {
      return undefined;
    }

    return cached;
  }

  setRelationshipQuery(
    sharedId: string,
    language: string,
    fileId: string | undefined,
    data: RelationshipQueryPayload
  ): void {
    if (!isClient) {
      return;
    }

    const key = this.relationshipQueryKey(sharedId, language, fileId);
    const existing = getCachedItem(this.relationshipQueryCache, key, this.ttls.relationshipQuery);
    if (existing?.anchorsLoaded && !data.anchorsLoaded) {
      return;
    }

    const payload: RelationshipQueryPayload = {
      ...data,
      seedRevision: this.getRelationshipSeedRevision(sharedId),
    };

    setCachedItem(this.relationshipQueryCache, key, payload, this.limits.relationshipQuery);
  }

  invalidateRelationshipQuery(sharedId: string): void {
    invalidateByPrefix(this.relationshipQueryCache, `${sharedId}:`);
  }

  getMainDocument(sharedId: string, language: string): FileType | undefined {
    if (!isClient) {
      return undefined;
    }

    const key = `${sharedId}:${language}`;
    return getCachedItem(this.mainDocumentCache, key, this.ttls.mainDocument);
  }

  setMainDocument(sharedId: string, language: string, data: FileType): void {
    if (isClient) {
      const key = `${sharedId}:${language}`;
      setCachedItem(this.mainDocumentCache, key, data, this.limits.mainDocument);
    }
  }

  clearMainDocument(sharedId: string, language: string): void {
    this.mainDocumentCache.delete(`${sharedId}:${language}`);
  }

  getPlaintext(documentId: string): string | undefined {
    if (!isClient) {
      return undefined;
    }

    return getCachedItem(this.plaintextCache, documentId, this.ttls.plaintext);
  }

  setPlaintext(documentId: string, text: string): void {
    if (isClient) {
      setCachedItem(this.plaintextCache, documentId, text, this.limits.plaintext);
    }
  }

  invalidatePlaintext(documentId: string): void {
    this.plaintextCache.delete(documentId);
  }

  getSearchResults(
    sharedId: string,
    language: string,
    searchTerm: string
  ): SnippetsSearchResponse | undefined {
    if (!isClient) {
      return undefined;
    }

    const key = `${sharedId}:${language}:${searchTerm.toLowerCase().trim()}`;
    return getCachedItem(this.searchResultsCache, key, this.ttls.searchResults);
  }

  setSearchResults(
    sharedId: string,
    language: string,
    searchTerm: string,
    results: SnippetsSearchResponse
  ): void {
    if (isClient) {
      const key = `${sharedId}:${language}:${searchTerm.toLowerCase().trim()}`;
      setCachedItem(this.searchResultsCache, key, results, this.limits.searchResults);
    }
  }

  invalidateSearchResults(sharedId: string): void {
    invalidateByPrefix(this.searchResultsCache, `${sharedId}:`);
  }

  invalidateAll(): void {
    this.entityCache.clear();
    this.mainDocumentCache.clear();
    this.plaintextCache.clear();
    this.searchResultsCache.clear();
    this.relationshipQueryCache.clear();
    this.relationshipSeedRevision.clear();
    this.refetchSharedIds.clear();
  }
}

export const entityLoaderCache = new EntityLoaderCache();
export { entityIncludesRelationships };
export type { EntityCacheOptions, RelationshipQueryCacheOptions };
