import { useCallback, useEffect, useRef, useState } from 'react';

/** Pause after typing before writing `search` to the URL (and re-running the loader). */
const SEARCH_DEBOUNCE_MS = 400;

const useLibrarySearchDraft = (urlSearch: string, commit: (value: string) => void) => {
  const [draft, setDraft] = useState(urlSearch);
  const committedRef = useRef(urlSearch);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    setDraft(urlSearch);
    committedRef.current = urlSearch;
  }, [urlSearch]);

  useEffect(() => {
    if (draft === committedRef.current) {
      return undefined;
    }
    const delay = draft === '' ? 0 : SEARCH_DEBOUNCE_MS;
    const timer = window.setTimeout(() => {
      if (draft === committedRef.current) {
        return;
      }
      committedRef.current = draft;
      commitRef.current(draft);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [draft]);

  const commitNow = useCallback((value: string) => {
    setDraft(value);
    if (value === committedRef.current) {
      return;
    }
    committedRef.current = value;
    commitRef.current(value);
  }, []);

  return { draft, setDraft, commitNow };
};

export { SEARCH_DEBOUNCE_MS, useLibrarySearchDraft };
