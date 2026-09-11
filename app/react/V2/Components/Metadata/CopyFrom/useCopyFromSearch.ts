import { useCallback, useEffect, useRef, useState } from 'react';
import type { Entity } from '#V2/api/entities/types.js';
import { useServices } from '#V2/services/index.js';

const COPY_FROM_SEARCH_LIMIT = 50;
const COPY_FROM_SEARCH_DEBOUNCE_MS = 300;

type UseCopyFromSearchParams = {
  currentTemplateId?: string;
  excludeSharedId?: string;
};

const useCopyFromSearch = ({ currentTemplateId, excludeSharedId }: UseCopyFromSearchParams) => {
  const { search } = useServices();
  const [query, setQuery] = useState('');
  const [sameTypeOnly, setSameTypeOnly] = useState(Boolean(currentTemplateId));
  const [results, setResults] = useState<Entity[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const generation = useRef(0);

  const runSearch = useCallback(
    async (searchQuery: string, restrictToCurrentType: boolean, requestId: number) => {
      const [result] = await search.search({
        searchTerm: searchQuery.trim() || undefined,
        templateIds: restrictToCurrentType && currentTemplateId ? [currentTemplateId] : undefined,
        publishedStatus: 'all',
        limit: COPY_FROM_SEARCH_LIMIT,
        fields: ['title', 'sharedId', 'template'],
      });
      if (requestId !== generation.current) return;
      const rows = (result?.rows ?? []) as Entity[];
      setResults(rows.filter(entity => entity.sharedId !== excludeSharedId));
      setIsSearching(false);
    },
    [currentTemplateId, excludeSharedId, search]
  );

  useEffect(() => {
    generation.current += 1;
    const requestId = generation.current;
    setIsSearching(true);
    const delay = query.trim() ? COPY_FROM_SEARCH_DEBOUNCE_MS : 0;
    const timeoutId = window.setTimeout(() => {
      runSearch(query, sameTypeOnly, requestId).catch(() => {
        if (requestId !== generation.current) return;
        setResults([]);
        setIsSearching(false);
      });
    }, delay);
    return () => window.clearTimeout(timeoutId);
  }, [query, runSearch, sameTypeOnly]);

  return {
    query,
    setQuery,
    sameTypeOnly,
    setSameTypeOnly,
    results,
    isSearching,
  };
};

export { useCopyFromSearch };
export type { UseCopyFromSearchParams };
