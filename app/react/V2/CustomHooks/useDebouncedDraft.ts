import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_DEBOUNCE_MS = 400;

type UseDebouncedDraftOptions<T> = {
  delay?: number;
  shouldCommitImmediately?: (value: T) => boolean;
  flushWhen?: string;
};

const useLatestRef = <T>(value: T) => {
  const ref = useRef(value);
  ref.current = value;
  return ref;
};

const commitIfChanged = <T>(
  value: T,
  committedRef: { current: T },
  commitRef: { current: (next: T) => void }
) => {
  if (value === committedRef.current) return;
  committedRef.current = value;
  commitRef.current(value);
};

const useFlushPendingDraft = <T>({
  flushWhen,
  draftRef,
  committedRef,
  commitRef,
}: {
  flushWhen: string | undefined;
  draftRef: { current: T };
  committedRef: { current: T };
  commitRef: { current: (next: T) => void };
}) => {
  useEffect(
    () => () => {
      commitIfChanged(draftRef.current, committedRef, commitRef);
    },
    [commitRef, committedRef, draftRef, flushWhen]
  );
};

const useDebouncedDraft = <T>(
  committed: T,
  commit: (value: T) => void,
  {
    delay = DEFAULT_DEBOUNCE_MS,
    shouldCommitImmediately,
    flushWhen,
  }: UseDebouncedDraftOptions<T> = {}
) => {
  const [draft, setDraft] = useState(committed);
  const committedRef = useRef(committed);
  const commitRef = useLatestRef(commit);
  const shouldCommitImmediatelyRef = useLatestRef(shouldCommitImmediately);
  const draftRef = useLatestRef(draft);
  useFlushPendingDraft({ flushWhen, draftRef, committedRef, commitRef });

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
      commitIfChanged(draft, committedRef, commitRef);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [commitRef, draft, delay, shouldCommitImmediatelyRef]);

  const commitNow = useCallback(
    (value: T) => {
      setDraft(value);
      commitIfChanged(value, committedRef, commitRef);
    },
    [commitRef]
  );

  return { draft, setDraft, commitNow };
};

export { DEFAULT_DEBOUNCE_MS, useDebouncedDraft };
export type { UseDebouncedDraftOptions };
