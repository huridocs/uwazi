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
): T | null => {
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  const age = Date.now() - cached.timestamp;

  if (age > ttl) {
    cache.delete(key);
    return null;
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
    entity: 5 * 60 * 1000, // 5 minutes
    plaintext: 10 * 60 * 1000, // 10 minutes
    searchResults: 3 * 60 * 1000, // 3 minutes
  };

  private limits = {
    entity: 50,
    plaintext: 100,
    searchResults: 30,
  };

  getEntity(sharedId: string, language: string): Entity | null {
    if (this.isSSR) {
      return null;
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

  getPlaintext(documentId: string, page: number): string | null {
    if (this.isSSR) {
      return null;
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

  getSearchResults(sharedId: string, searchTerm: string): SnippetsSearchResponse | null {
    if (this.isSSR) {
      return null;
    }

    const key = `${sharedId}:${searchTerm.toLowerCase().trim()}`;
    return getCachedItem(this.searchResultsCache, key, this.ttls.searchResults);
  }

  setSearchResults(sharedId: string, searchTerm: string, results: SnippetsSearchResponse): void {
    if (!this.isSSR) {
      const key = `${sharedId}:${searchTerm.toLowerCase().trim()}`;
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

  invalidateEntityComplete(sharedId: string, documentId?: string): void {
    this.invalidateEntity(sharedId);
    if (documentId) {
      this.invalidatePlaintext(documentId);
    }
  }

  getStats() {
    return {
      entity: {
        size: this.entityCache.size,
        keys: Array.from(this.entityCache.keys()),
      },
      plaintext: {
        size: this.plaintextCache.size,
        keys: Array.from(this.plaintextCache.keys()),
      },
      searchResults: {
        size: this.searchResultsCache.size,
        keys: Array.from(this.searchResultsCache.keys()),
      },
    };
  }
}

export const entityLoaderCache = new EntityLoaderCache();
