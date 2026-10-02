import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useStore } from 'jotai';
import { getStore } from '#shared/atomStore/index.js';
import { entityPageViewAtom } from '#V2/atoms/entityPageViewAtom.js';
import type { EntityPageViewData } from './types.js';

type EntityPageViewContextValue = {
  entityPageView: EntityPageViewData | null;
  hasEntityPageView: boolean;
};

const EntityPageViewContext = createContext<EntityPageViewContextValue | null>(null);

const EntityPageViewProvider = ({
  entityPageView,
  children,
}: {
  entityPageView?: EntityPageViewData;
  children: ReactNode;
}) => {
  const store = useStore();
  const published = entityPageView ?? null;
  const publish = useCallback(
    (value: EntityPageViewData | null) => {
      store.set(entityPageViewAtom, value);
      const globalStore = getStore();
      if (globalStore !== store) {
        globalStore.set(entityPageViewAtom, value);
      }
    },
    [store]
  );
  if (store.get(entityPageViewAtom) !== published) {
    publish(published);
  }
  const value = useMemo(
    () => ({
      entityPageView: published,
      hasEntityPageView: Boolean(published),
    }),
    [published]
  );

  useLayoutEffect(() => {
    const snapshot = published;
    return () => {
      if (store.get(entityPageViewAtom) === snapshot) {
        publish(null);
      }
    };
  }, [publish, published, store]);

  return <EntityPageViewContext.Provider value={value}>{children}</EntityPageViewContext.Provider>;
};

const useEntityPageView = () => {
  const context = useContext(EntityPageViewContext);
  if (!context) {
    return { entityPageView: null, hasEntityPageView: false };
  }
  return context;
};

export { EntityPageViewProvider, useEntityPageView };
