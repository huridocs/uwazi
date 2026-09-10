import { useCallback, useEffect, useRef, useState } from 'react';
import { searchByTitle } from '#V2/api/entities/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { ApiResponse } from '#V2/api/ApiResponse.js';

const COPY_FROM_SEARCH_LIMIT = 50;
const COPY_FROM_SEARCH_DEBOUNCE_MS = 300;

type CopyFromSearchArgs = {
  title?: string;
  template?: string[];
  limit?: number;
};

type CopyFromSearchCandidates = (
  args: CopyFromSearchArgs
) => Promise<ApiResponse<Entity[] | undefined>>;

const searchCopyFromCandidates: CopyFromSearchCandidates = async ({ title, template, limit }) =>
  searchByTitle({ title, template, limit });

type UseCopyFromSearchParams = {
  currentTemplateId?: string;
  excludeSharedId?: string;
  searchCandidates?: CopyFromSearchCandidates;
};

const useCopyFromSearch = ({
  currentTemplateId,
  excludeSharedId,
  searchCandidates = searchCopyFromCandidates,
}: UseCopyFromSearchParams) => {
  const [query, setQuery] = useState('');
  const [sameTypeOnly, setSameTypeOnly] = useState(Boolean(currentTemplateId));
  const [results, setResults] = useState<Entity[]>([]);
  const [isSearching, setIsSearching] = useState(true);
  const generation = useRef(0);

  const runSearch = useCallback(
    async (searchQuery: string, restrictToCurrentType: boolean, requestId: number) => {
      const [rows] = await searchCandidates({
        title: searchQuery,
        template: restrictToCurrentType && currentTemplateId ? [currentTemplateId] : undefined,
        limit: COPY_FROM_SEARCH_LIMIT,
      });
      if (requestId !== generation.current) return;
      setResults((rows ?? []).filter(entity => entity.sharedId !== excludeSharedId));
      setIsSearching(false);
    },
    [currentTemplateId, excludeSharedId, searchCandidates]
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

export { searchCopyFromCandidates, useCopyFromSearch };
export type { CopyFromSearchArgs, CopyFromSearchCandidates };
