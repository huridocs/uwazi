import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useAtomValue, useStore } from 'jotai';
import { useLocation, useNavigate } from 'react-router';
import {
  bindEntityUrlSession,
  unbindEntityUrlSession,
  entityPageAtom,
  parseEntityHash,
  serializeEntityHash,
  setEntityPageAtom,
  splitEntityHash,
  stripSearch,
  updateEntityUrl,
  type UpdateEntityUrlOptions,
} from './entityUrlAtoms.js';

const EntityUrlSearchContext = createContext('');
const EntityUrlHashUiContext = createContext('');
const EntityUrlRawContext = createContext(false);

const useIsolatedEntityUrl = (pathname: string) => {
  const [local, setLocal] = useState({ search: '', hash: '' });
  const navigate = useCallback((to: { pathname: string; search: string; hash: string }) => {
    setLocal({ search: to.search, hash: to.hash });
  }, []);
  return { location: { pathname, search: local.search, hash: local.hash }, navigate };
};

const useRouterPageAtom = (page: string, store: ReturnType<typeof useStore>) => {
  const routerPageRef = useRef<string | undefined>(undefined);
  if (routerPageRef.current !== page) {
    routerPageRef.current = page;
    setEntityPageAtom(page, store);
  }
};

const useEntityUrlSource = (isolated: boolean) => {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const isolatedUrl = useIsolatedEntityUrl(location.pathname);
  const navigate = isolated ? isolatedUrl.navigate : routerNavigate;
  const source = isolated ? isolatedUrl.location : location;
  const session = useMemo(
    () => ({
      pathname: source.pathname,
      search: source.search,
      hash: source.hash,
      writesRouter: !isolated,
    }),
    [isolated, source.hash, source.pathname, source.search]
  );
  return { navigate, source, session };
};

const EntityUrlSync = ({
  children,
  isolated = false,
}: PropsWithChildren<{ isolated?: boolean }>) => {
  const { navigate, source, session } = useEntityUrlSource(isolated);
  const store = useStore();
  bindEntityUrlSession(navigate, store, session);
  useEffect(() => {
    bindEntityUrlSession(navigate, store, session);
  }, [navigate, session, store]);
  useEffect(() => () => unbindEntityUrlSession(), []);
  const split = useMemo(() => splitEntityHash(source.hash), [source.hash]);
  const search = stripSearch(source.search);
  useRouterPageAtom(split.page, store);
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

const useEntityDocumentPage = () => Number.parseInt(useAtomValue(entityPageAtom), 10) || 1;
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
