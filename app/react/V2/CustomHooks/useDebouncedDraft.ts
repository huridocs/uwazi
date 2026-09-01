import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DEBOUNCE_MS = 400;

type UseDebouncedDraftOptions<T> = {
  delay?: number;
  /** When this returns true, the draft is committed with no idle wait. */
  shouldCommitImmediately?: (value: T) => boolean;
};

/** Local draft that commits after idle, with an immediate-commit API. */
const useDebouncedDraft = <T>(
  committed: T,
  commit: (value: T) => void,
  { delay = DEFAULT_DEBOUNCE_MS, shouldCommitImmediately }: UseDebouncedDraftOptions<T> = {}
) => {
  const [draft, setDraft] = useState(committed);
  const committedRef = useRef(committed);
  const commitRef = useRef(commit);
  commitRef.current = commit;
  const shouldCommitImmediatelyRef = useRef(shouldCommitImmediately);
  shouldCommitImmediatelyRef.current = shouldCommitImmediately;

  useEffect(() => {
    setDraft(committed);
    committedRef.current = committed;
  }, [committed]);

  useEffect(() => {
    if (draft === committedRef.current) {
      return undefined;
    }
    const wait = shouldCommitImmediatelyRef.current?.(draft) ? 0 : delay;
    const timer = window.setTimeout(() => {
      if (draft === committedRef.current) {
        return;
      }
      committedRef.current = draft;
      commitRef.current(draft);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [draft, delay]);

  const commitNow = useCallback((value: T) => {
    setDraft(value);
    if (value === committedRef.current) {
      return;
    }
    committedRef.current = value;
    commitRef.current(value);
  }, []);

  return { draft, setDraft, commitNow };
};

export { DEFAULT_DEBOUNCE_MS, useDebouncedDraft };
export type { UseDebouncedDraftOptions };
