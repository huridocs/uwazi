import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useAtomValue, useStore } from 'jotai';
import { useLocation, useNavigate, type NavigateFunction } from 'react-router';
import {
  entityPageAtom,
  parseEntityHash,
  serializeEntityHash,
  setEntityPageAtom,
  splitEntityHash,
  stripSearch,
  type EntityUrlAtomStore,
} from './entityUrlAtoms.js';
import { PAGE_PARAM } from './urlParams.js';

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
let navigateRef: NavigateFunction | null = null;
let locationRef: LocationFallback = { pathname: '', search: '', hash: '' };
let atomStoreRef: EntityUrlAtomStore | null = null;

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
const applyPatches = (fallback: LocationFallback, batch: PendingBatch) => {
  const nextSearch = new URLSearchParams(stripSearch(fallback.search));
  const nextHash = parseEntityHash(fallback.hash);
  batch.searchPatches.forEach(patch => patch(nextSearch));
  batch.hashPatches.forEach(patch => patch(nextHash));
  const searchStr = nextSearch.toString();
  const hash = serializeEntityHash(nextHash);
  return {
    search: searchStr ? `?${searchStr}` : '',
    hash,
    page: nextHash.get(PAGE_PARAM) || '1',
  };
};

const replaceUrlWithoutRouter = (url: string) => {
  History.prototype.replaceState.call(window.history, window.history.state, '', url);
};

const mergePageIntoHash = (hash: string, page: string) => {
  const params = parseEntityHash(hash);
  params.set(PAGE_PARAM, page);
  return serializeEntityHash(params);
};

const fallbackWithAtomPage = (fallback: LocationFallback): LocationFallback => {
  if (!atomStoreRef) {
    return fallback;
  }
  const atomPage = atomStoreRef.get(entityPageAtom);
  const fallbackPage = splitEntityHash(fallback.hash).page;
  if (atomPage === fallbackPage) {
    return fallback;
  }
  return { ...fallback, hash: mergePageIntoHash(fallback.hash, atomPage) };
};

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
  if (enqueuedPath !== null && live.pathname !== enqueuedPath) {
    return;
  }

  const current = fallbackWithAtomPage(fallback);
  const patched = applyPatches(current, batch);
  const { search } = patched;
  let { hash, page } = patched;
  if (
    fallback.pathname === locationRef.pathname &&
    search === current.search &&
    hash === current.hash
  ) {
    return;
  }

  const canUseWindowHistory = typeof window !== 'undefined' && live.pathname === fallback.pathname;
  const pageOnly = canUseWindowHistory && isPageOnlyChange(current, search, hash);

  if (pageOnly) {
    replaceUrlWithoutRouter(`${fallback.pathname}${search}${hash}`);
    if (atomStoreRef) {
      setEntityPageAtom(page, atomStoreRef);
    }
    return;
  }

  if (atomStoreRef) {
    const atomPage = atomStoreRef.get(entityPageAtom);
    const currentPage = splitEntityHash(current.hash).page;
    if (page === currentPage) {
      hash = mergePageIntoHash(hash, atomPage);
      page = atomPage;
    } else {
      setEntityPageAtom(page, atomStoreRef);
    }
  }

  void navigate(
    {
      pathname: fallback.pathname,
      search,
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
    pathnameAtEnqueue =
      typeof window !== 'undefined' ? window.location.pathname : fallback.pathname;
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

const updateEntityUrl = (options: UpdateEntityUrlOptions) => {
  if (!navigateRef) {
    return;
  }
  enqueueEntityUrlUpdate(options, navigateRef, locationRef);
};

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const EntityUrlSearchContext = createContext('');
const EntityUrlHashUiContext = createContext('');
const EntityUrlRawContext = createContext(false);

const EntityUrlSync = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  navigateRef = navigate;
  atomStoreRef = store;
  locationRef = {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  };
  const split = useMemo(() => splitEntityHash(location.hash), [location.hash]);
  const search = stripSearch(location.search);
  useIsomorphicLayoutEffect(() => {
    setEntityPageAtom(split.page, store);
  }, [split.page, store]);
  return createElement(
    EntityUrlSearchContext.Provider,
    { value: search },
    createElement(
      EntityUrlHashUiContext.Provider,
      { value: split.ui },
      createElement(EntityUrlRawContext.Provider, { value: split.raw }, children)
    )
  );
};

const useEntityHashUiParams = () => {
  const hashUi = useContext(EntityUrlHashUiContext);
  return useMemo(() => new URLSearchParams(hashUi), [hashUi]);
};

const useEntitySearchParams = () => {
  const search = useContext(EntityUrlSearchContext);
  return useMemo(() => new URLSearchParams(search), [search]);
};

const useEntityDocumentPage = () => {
  const page = useAtomValue(entityPageAtom);
  return Number.parseInt(page, 10) || 1;
};

const useEntityRawView = () => useContext(EntityUrlRawContext);

const useUpdateEntityUrl = () => updateEntityUrl;

export {
  parseEntityHash,
  serializeEntityHash,
  useEntityHashUiParams,
  useEntitySearchParams,
  useEntityDocumentPage,
  useEntityRawView,
  useUpdateEntityUrl,
  EntityUrlSync,
};
export type { UpdateEntityUrlOptions };
