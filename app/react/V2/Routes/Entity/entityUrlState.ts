import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate, type NavigateFunction } from 'react-router';

type UpdateEntityUrlOptions = {
  replace?: boolean;
  search?: (params: URLSearchParams) => void;
  hash?: (params: URLSearchParams) => void;
};

type LocationFallback = {
  pathname: string;
  search: string;
  hash: string;
};

type PendingBatch = {
  replace: boolean;
  searchPatches: Array<(params: URLSearchParams) => void>;
  hashPatches: Array<(params: URLSearchParams) => void>;
};

let pendingBatch: PendingBatch | null = null;
let flushScheduled = false;
let pathnameAtEnqueue: string | null = null;

const parseEntityHash = (hash: string = ''): URLSearchParams => {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
};

const serializeEntityHash = (params: URLSearchParams): string => {
  const str = params.toString();
  return str ? `#${str}` : '';
};

const readLiveLocation = (fallback: LocationFallback): LocationFallback => {
  if (typeof window === 'undefined') {
    return fallback;
  }
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
};

// eslint-disable-next-line max-statements
const flushEntityUrlUpdates = (navigate: NavigateFunction, fallback: LocationFallback) => {
  flushScheduled = false;
  const batch = pendingBatch;
  const enqueuedPath = pathnameAtEnqueue;
  pendingBatch = null;
  pathnameAtEnqueue = null;
  if (!batch) {
    return;
  }

  const live = readLiveLocation(fallback);
  // Drop only when the browser path changed during the microtask (left the page).
  if (enqueuedPath !== null && live.pathname !== enqueuedPath) {
    return;
  }

  const base = live.pathname === fallback.pathname ? live : fallback;
  const nextSearch = new URLSearchParams(
    base.search.startsWith('?') ? base.search.slice(1) : base.search
  );
  const nextHash = parseEntityHash(base.hash);
  batch.searchPatches.forEach(patch => patch(nextSearch));
  batch.hashPatches.forEach(patch => patch(nextHash));
  const search = nextSearch.toString();
  const hash = serializeEntityHash(nextHash);

  // eslint-disable-next-line no-void -- RR navigate may return a Promise; fire-and-forget flush
  void navigate(
    {
      pathname: fallback.pathname,
      search: search ? `?${search}` : '',
      hash,
    },
    { replace: batch.replace, preventScrollReset: true }
  );
};

const scheduleEntityUrlFlush = (navigate: NavigateFunction, fallback: LocationFallback) => {
  if (flushScheduled) {
    return;
  }
  flushScheduled = true;
  queueMicrotask(() => flushEntityUrlUpdates(navigate, fallback));
};

const enqueueEntityUrlUpdate = (
  options: UpdateEntityUrlOptions,
  navigate: NavigateFunction,
  fallback: LocationFallback
) => {
  if (!pendingBatch) {
    pendingBatch = {
      replace: options.replace ?? true,
      searchPatches: [],
      hashPatches: [],
    };
    pathnameAtEnqueue = typeof window !== 'undefined' ? window.location.pathname : fallback.pathname;
  }
  if (options.search) {
    pendingBatch.searchPatches.push(options.search);
  }
  if (options.hash) {
    pendingBatch.hashPatches.push(options.hash);
  }
  if (options.replace === false) {
    pendingBatch.replace = false;
  }
  scheduleEntityUrlFlush(navigate, fallback);
};

const useEntityHashParams = () => {
  const { hash } = useLocation();
  return useMemo(() => parseEntityHash(hash), [hash]);
};

const useUpdateEntityUrl = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const fallback = useMemo<LocationFallback>(
    () => ({
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
    }),
    [location.hash, location.pathname, location.search]
  );

  return useCallback(
    (options: UpdateEntityUrlOptions) => {
      enqueueEntityUrlUpdate(options, navigate, fallback);
    },
    [fallback, navigate]
  );
};

export { parseEntityHash, serializeEntityHash, useEntityHashParams, useUpdateEntityUrl };
export type { UpdateEntityUrlOptions };
