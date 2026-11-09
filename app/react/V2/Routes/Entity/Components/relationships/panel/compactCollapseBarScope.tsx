import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

type CompactCollapseBarStore = {
  count: number;
  listeners: Set<() => void>;
  subscribe: (onStoreChange: () => void) => () => void;
  getSnapshot: () => boolean;
  notify: () => void;
};

const createCompactCollapseBarStore = (): CompactCollapseBarStore => {
  const store: CompactCollapseBarStore = {
    count: 0,
    listeners: new Set(),
    subscribe: onStoreChange => {
      store.listeners.add(onStoreChange);
      return () => {
        store.listeners.delete(onStoreChange);
      };
    },
    getSnapshot: () => store.count > 0,
    notify: () => {
      store.listeners.forEach(onStoreChange => onStoreChange());
    },
  };
  return store;
};

const CompactCollapseBarContext = createContext<CompactCollapseBarStore | null>(null);

const useCompactCollapseBarStore = () => {
  const store = useContext(CompactCollapseBarContext);
  if (!store) throw new Error('Compact collapse bar scope not found');
  return store;
};

const CompactCollapseBarProvider = ({ children }: { children: React.ReactNode }) => {
  const [store] = useState(createCompactCollapseBarStore);
  return (
    <CompactCollapseBarContext.Provider value={store}>
      {children}
    </CompactCollapseBarContext.Provider>
  );
};

const useCompactCollapseBarMounted = () => {
  const store = useCompactCollapseBarStore();
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => false);
};

const useRetainCompactCollapseBar = (active: boolean) => {
  const store = useCompactCollapseBarStore();

  useEffect(() => {
    if (!active) return undefined;
    store.count += 1;
    store.notify();
    return () => {
      store.count -= 1;
      store.notify();
    };
  }, [active, store]);
};

export { CompactCollapseBarProvider, useCompactCollapseBarMounted, useRetainCompactCollapseBar };
