import { useEffect, useRef, useState } from 'react';
import { snippets } from '#V2/api/search/index.js';
import type { SnippetsSearchResponse } from '#V2/api/types.js';
import { entityLoaderCache } from '../../EntityLoaderCache.js';
import { isSnippetsResponse, scopeResultsToDocument } from './searchUtils.js';

const useEntitySearchSnippets = ({
  searchTerm,
  sharedId,
  language,
  mainDocumentId,
  documentFilename,
}: {
  searchTerm: string;
  sharedId?: string;
  language: string;
  mainDocumentId?: string;
  documentFilename?: string;
}) => {
  const [searchResults, setSearchResults] = useState<SnippetsSearchResponse | undefined>();
  const [searchError, setSearchError] = useState(false);
  const requestSeq = useRef(0);
  const cacheKeyLanguage = `${language}:${mainDocumentId ?? ''}`;

  // eslint-disable-next-line max-statements
  useEffect(() => {
    if (!searchTerm || !sharedId) {
      setSearchResults(undefined);
      setSearchError(false);
      return undefined;
    }

    const seq = requestSeq.current + 1;
    requestSeq.current = seq;
    setSearchResults(undefined);
    setSearchError(false);

    // eslint-disable-next-line max-statements
    const load = async () => {
      const cached = entityLoaderCache.getSearchResults(sharedId, cacheKeyLanguage, searchTerm);
      if (cached) {
        if (seq === requestSeq.current) {
          setSearchResults(scopeResultsToDocument(cached, documentFilename));
        }
        return;
      }

      const results = await snippets(
        { sharedId, searchString: searchTerm, limit: 0 },
        { 'Content-Language': language }
      );

      if (seq !== requestSeq.current) return;

      if (!isSnippetsResponse(results)) {
        setSearchError(true);
        return;
      }

      entityLoaderCache.setSearchResults(sharedId, cacheKeyLanguage, searchTerm, results);
      setSearchResults(scopeResultsToDocument(results, documentFilename));
    };

    load().catch(() => {
      if (seq === requestSeq.current) setSearchError(true);
    });

    return undefined;
  }, [searchTerm, language, cacheKeyLanguage, sharedId, mainDocumentId, documentFilename]);

  return { searchResults, searchError };
};

export { useEntitySearchSnippets };
