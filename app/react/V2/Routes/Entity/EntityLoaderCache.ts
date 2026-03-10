import { Entity } from 'V2/domain';
import { SnippetsSearchResponse } from 'V2/api/types';
import { isClient } from 'app/utils';

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
  private entityCache = new Map<string, CachedItem<Entity>>();

  private plaintextCache = new Map<string, CachedItem<string>>();

  private searchResultsCache = new Map<string, CachedItem<SnippetsSearchResponse>>();

  private isSSR = !isClient;

  private ttls = {
    entity: 5 * 60 * 1000,
    plaintext: 5 * 60 * 1000,
    searchResults: 5 * 60 * 1000,
  };

  private limits = {
    entity: 20,
    plaintext: 20,
    searchResults: 20,
  };

  getEntity(sharedId: string, language: string): Entity | undefined {
    if (this.isSSR) {
      return undefined;
    }

    const key = `${sharedId}:${language}`;

    return getCachedItem(this.entityCache, key, this.ttls.entity);
  }

  setEntity(sharedId: string, language: string, data: Entity): void {
    if (!this.isSSR) {
      const key = `${sharedId}:${language}`;
      setCachedItem(this.entityCache, key, data, this.limits.entity);
    }
  }

  invalidateEntity(sharedId: string): void {
    invalidateByPrefix(this.entityCache, `${sharedId}:`);
    this.invalidateSearchResults(sharedId);
  }

  getPlaintext(documentId: string, page: number): string | undefined {
    if (this.isSSR) {
      return undefined;
    }

    const key = `${documentId}:${page}`;
    return getCachedItem(this.plaintextCache, key, this.ttls.plaintext);
  }

  setPlaintext(documentId: string, page: number, text: string): void {
    if (!this.isSSR) {
      const key = `${documentId}:${page}`;
      setCachedItem(this.plaintextCache, key, text, this.limits.plaintext);
    }
  }

  invalidatePlaintext(documentId: string): void {
    invalidateByPrefix(this.plaintextCache, `${documentId}:`);
  }

  getSearchResults(
    sharedId: string,
    language: string,
    searchTerm: string
  ): SnippetsSearchResponse | undefined {
    if (this.isSSR) {
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
    if (!this.isSSR) {
      const key = `${sharedId}:${language}:${searchTerm.toLowerCase().trim()}`;
      setCachedItem(this.searchResultsCache, key, results, this.limits.searchResults);
    }
  }

  invalidateSearchResults(sharedId: string): void {
    invalidateByPrefix(this.searchResultsCache, `${sharedId}:`);
  }

  invalidateAll(): void {
    this.entityCache.clear();
    this.plaintextCache.clear();
    this.searchResultsCache.clear();
  }
}

export const entityLoaderCache = new EntityLoaderCache();
