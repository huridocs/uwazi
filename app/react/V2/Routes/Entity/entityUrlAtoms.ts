import { atom, createStore } from 'jotai';
import { PAGE_PARAM, VIEW_MODE_PARAM } from './urlParams.js';

type EntityUrlAtomStore = ReturnType<typeof createStore>;

const entityPageAtom = atom('1');

const parseEntityHash = (hash: string = ''): URLSearchParams => {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash;
  return new URLSearchParams(raw);
};

const serializeEntityHash = (params: URLSearchParams): string => {
  const str = params.toString();
  return str ? `#${str}` : '';
};

const stripSearch = (search: string) => (search.startsWith('?') ? search.slice(1) : search);

const splitEntityHash = (hash: string) => {
  const params = parseEntityHash(hash);
  const page = params.get(PAGE_PARAM) || '1';
  const raw = params.get(VIEW_MODE_PARAM) === 'true';
  params.delete(PAGE_PARAM);
  params.delete(VIEW_MODE_PARAM);
  return { page, raw, ui: params.toString() };
};

const setEntityPageAtom = (page: string, store: EntityUrlAtomStore) => {
  if (store.get(entityPageAtom) !== page) {
    store.set(entityPageAtom, page);
  }
};

type UpdateEntityUrlOptions = {
  replace?: boolean;
  search?: (params: URLSearchParams) => void;
  hash?: (params: URLSearchParams) => void;
};

type LocationFallback = { pathname: string; search: string; hash: string };

type PendingBatch = {
  replace: boolean;
  searchPatches: Array<(params: URLSearchParams) => void>;
  hashPatches: Array<(params: URLSearchParams) => void>;
};

type UrlPatch = { search: string; hash: string; page: string };

type NavigateFn = (
  to: { pathname: string; search: string; hash: string },
  opts: { replace: boolean; preventScrollReset: boolean }
) => void | Promise<void>;

let pendingBatch: PendingBatch | null = null;
let flushScheduled = false;
let pathnameAtEnqueue: string | null = null;
let navigateRef: NavigateFn | null = null;
let locationRef: LocationFallback = { pathname: '', search: '', hash: '' };
let atomStoreRef: EntityUrlAtomStore | null = null;
let sessionGeneration = 0;

const readLiveLocation = (fallback: LocationFallback): LocationFallback => {
  if (typeof window === 'undefined') return fallback;
  return {
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash,
  };
};

const isPageOnlyChange = (fallback: LocationFallback, search: string, hash: string) => {
  const next = splitEntityHash(hash);
  const prev = splitEntityHash(fallback.hash);
  return (
    stripSearch(search) === stripSearch(fallback.search) &&
    next.ui === prev.ui &&
    next.raw === prev.raw &&
    next.page !== prev.page
  );
};

const applyPatches = (fallback: LocationFallback, batch: PendingBatch): UrlPatch => {
  const nextSearch = new URLSearchParams(stripSearch(fallback.search));
  const nextHash = parseEntityHash(fallback.hash);
  batch.searchPatches.forEach(patch => patch(nextSearch));
  batch.hashPatches.forEach(patch => patch(nextHash));
  const searchStr = nextSearch.toString();
  return {
    search: searchStr ? `?${searchStr}` : '',
    hash: serializeEntityHash(nextHash),
    page: nextHash.get(PAGE_PARAM) || '1',
  };
};

const mergePageIntoHash = (hash: string, page: string) => {
  const params = parseEntityHash(hash);
  params.set(PAGE_PARAM, page);
  return serializeEntityHash(params);
};

const fallbackWithAtomPage = (fallback: LocationFallback): LocationFallback => {
  if (!atomStoreRef) return fallback;
  const atomPage = atomStoreRef.get(entityPageAtom);
  if (atomPage === splitEntityHash(fallback.hash).page) return fallback;
  return { ...fallback, hash: mergePageIntoHash(fallback.hash, atomPage) };
};

const takePendingBatch = () => {
  const batch = pendingBatch;
  const enqueuedPath = pathnameAtEnqueue;
  pendingBatch = null;
  pathnameAtEnqueue = null;
  return { batch, enqueuedPath };
};

const urlUnchanged = (fallback: LocationFallback, current: LocationFallback, patch: UrlPatch) =>
  fallback.pathname === locationRef.pathname &&
  patch.search === current.search &&
  patch.hash === current.hash;

const commitPageOnlyUrl = (fallback: LocationFallback, patch: UrlPatch) => {
  History.prototype.replaceState.call(
    window.history,
    window.history.state,
    '',
    `${fallback.pathname}${patch.search}${patch.hash}`
  );
  if (atomStoreRef) setEntityPageAtom(patch.page, atomStoreRef);
};

const commitNavigateUrl = ({
  navigate,
  fallback,
  batch,
  current,
  patch,
}: {
  navigate: NavigateFn;
  fallback: LocationFallback;
  batch: PendingBatch;
  current: LocationFallback;
  patch: UrlPatch;
}) => {
  let nextHash = patch.hash;
  if (atomStoreRef) {
    const atomPage = atomStoreRef.get(entityPageAtom);
    if (patch.page === splitEntityHash(current.hash).page) {
      nextHash = mergePageIntoHash(patch.hash, atomPage);
    } else {
      setEntityPageAtom(patch.page, atomStoreRef);
    }
  }
  void navigate(
    { pathname: fallback.pathname, search: patch.search, hash: nextHash },
    { replace: batch.replace, preventScrollReset: true }
  );
};

const applyFlushedUrl = ({
  navigate,
  fallback,
  batch,
  live,
  current,
}: {
  navigate: NavigateFn;
  fallback: LocationFallback;
  batch: PendingBatch;
  live: LocationFallback;
  current: LocationFallback;
}) => {
  const patch = applyPatches(current, batch);
  if (urlUnchanged(fallback, current, patch)) return;
  const pageOnly =
    typeof window !== 'undefined' &&
    live.pathname === fallback.pathname &&
    isPageOnlyChange(current, patch.search, patch.hash);
  if (pageOnly) {
    commitPageOnlyUrl(fallback, patch);
    return;
  }
  commitNavigateUrl({ navigate, fallback, batch, current, patch });
};

const flushEntityUrlUpdates = (navigate: NavigateFn, fallback: LocationFallback) => {
  flushScheduled = false;
  const { batch, enqueuedPath } = takePendingBatch();
  if (!batch) return;
  const live = readLiveLocation(fallback);
  if (enqueuedPath !== null && live.pathname !== enqueuedPath) return;
  applyFlushedUrl({
    navigate,
    fallback,
    batch,
    live,
    current: fallbackWithAtomPage(fallback),
  });
};

const enqueueEntityUrlUpdate = (
  options: UpdateEntityUrlOptions,
  navigate: NavigateFn,
  fallback: LocationFallback
) => {
  if (!pendingBatch) {
    pendingBatch = { replace: options.replace ?? true, searchPatches: [], hashPatches: [] };
    pathnameAtEnqueue =
      typeof window !== 'undefined' ? window.location.pathname : fallback.pathname;
  }
  if (options.search) pendingBatch.searchPatches.push(options.search);
  if (options.hash) pendingBatch.hashPatches.push(options.hash);
  if (options.replace === false) pendingBatch.replace = false;
  if (!flushScheduled) {
    flushScheduled = true;
    const generation = sessionGeneration;
    queueMicrotask(() => {
      if (generation !== sessionGeneration) return;
      flushEntityUrlUpdates(navigate, fallback);
    });
  }
};

const updateEntityUrl = (options: UpdateEntityUrlOptions) => {
  if (navigateRef) enqueueEntityUrlUpdate(options, navigateRef, locationRef);
};

const bindEntityUrlSession = (
  navigate: NavigateFn,
  store: EntityUrlAtomStore,
  location: LocationFallback
) => {
  navigateRef = navigate;
  atomStoreRef = store;
  locationRef = location;
};

const unbindEntityUrlSession = () => {
  sessionGeneration += 1;
  navigateRef = null;
  atomStoreRef = null;
  locationRef = { pathname: '', search: '', hash: '' };
  pendingBatch = null;
  flushScheduled = false;
  pathnameAtEnqueue = null;
};

export {
  entityPageAtom,
  parseEntityHash,
  serializeEntityHash,
  stripSearch,
  splitEntityHash,
  setEntityPageAtom,
  updateEntityUrl,
  bindEntityUrlSession,
  unbindEntityUrlSession,
};
export type { EntityUrlAtomStore, UpdateEntityUrlOptions, LocationFallback };
