import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
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

const useRouterPageAtom = (page: string, store: ReturnType<typeof useStore>) => {
  const routerPageRef = useRef<string | undefined>();
  if (routerPageRef.current !== page) {
    routerPageRef.current = page;
    setEntityPageAtom(page, store);
  }
};

const EntityUrlSync = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  bindEntityUrlSession(navigate, store, {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
  });
  const split = useMemo(() => splitEntityHash(location.hash), [location.hash]);
  const search = stripSearch(location.search);
  useRouterPageAtom(split.page, store);
  useEffect(() => () => unbindEntityUrlSession(), []);
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
