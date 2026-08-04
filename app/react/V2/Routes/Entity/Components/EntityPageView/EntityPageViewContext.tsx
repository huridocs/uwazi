import React, { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useSetAtom } from 'jotai';
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
  const setEntityPageViewAtom = useSetAtom(entityPageViewAtom);
  const value = useMemo(
    () => ({
      entityPageView: entityPageView ?? null,
      hasEntityPageView: Boolean(entityPageView),
    }),
    [entityPageView]
  );

  useEffect(() => {
    setEntityPageViewAtom(entityPageView ?? null);
    return () => setEntityPageViewAtom(null);
  }, [entityPageView, setEntityPageViewAtom]);

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
