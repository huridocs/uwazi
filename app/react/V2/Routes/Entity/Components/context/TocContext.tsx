import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { TocSchema } from '#shared/types/commonTypes.js';
import { sortTocEntries } from '../ToC/ToC.js';
import { findItemsWithChildren, normalizeToc } from '../ToC/utils.js';
import type { TocState } from './types.js';

const initialTocState: TocState = {
  toc: undefined,
  isEditMode: false,
  expanded: {},
  isAllExpanded: false,
  isAllCollapsed: true,
  isSaving: false,
};

const expandedChildren = (toc: TocSchema[]) =>
  findItemsWithChildren(normalizeToc(toc)).reduce<Record<number, boolean>>((expanded, index) => {
    expanded[index] = true;
    return expanded;
  }, {});

const TocStateContext = createContext<TocState | null>(null);
const TocActionsContext = createContext<{
  setTocState: React.Dispatch<React.SetStateAction<TocState>>;
  addEntry:(entry: TocSchema) => void;
  setToc: (toc: TocSchema[] | undefined) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setEditMode: (enabled: boolean) => void;
  updateEntry: (index: number, entry: Partial<TocSchema>) => void;
  deleteEntry: (index: number) => void;
  toggleExpand: (index: number) => void;
  reset: () => void;
} | null>(null);

const TocProvider = ({ children }: { children: React.ReactNode }) => {
  const [tocState, setTocState] = useState(initialTocState);

  const addEntry = useCallback((entry: TocSchema) => {
    setTocState(current => {
      const toc = sortTocEntries(current.toc ? [...current.toc, entry] : [entry]);
      return { ...current, toc, isEditMode: true, expanded: expandedChildren(toc) };
    });
  }, []);

  const setToc = useCallback((toc: TocSchema[] | undefined) => {
    setTocState(current => ({ ...current, toc }));
  }, []);

  const expandAll = useCallback(() => {
    setTocState(current => {
      if (!current.toc) return current;
      return { ...current, expanded: expandedChildren(current.toc) };
    });
  }, []);

  const collapseAll = useCallback(() => {
    setTocState(current => ({ ...current, expanded: {} }));
  }, []);

  const setEditMode = useCallback((enabled: boolean) => {
    setTocState(current => ({
      ...current,
      isEditMode: enabled,
      expanded: enabled && current.toc ? expandedChildren(current.toc) : current.expanded,
    }));
  }, []);

  const updateEntry = useCallback((index: number, entry: Partial<TocSchema>) => {
    setTocState(current => {
      if (!current.toc) return current;
      const toc = [...current.toc];
      toc[index] = { ...toc[index], ...entry };
      return { ...current, toc };
    });
  }, []);

  const deleteEntry = useCallback((index: number) => {
    setTocState(current => {
      if (!current.toc) return current;
      return { ...current, toc: current.toc.filter((_, itemIndex) => itemIndex !== index) };
    });
  }, []);

  const toggleExpand = useCallback((index: number) => {
    setTocState(current => ({
      ...current,
      expanded: { ...current.expanded, [index]: !current.expanded[index] },
    }));
  }, []);

  const reset = useCallback(() => {
    setTocState(initialTocState);
  }, []);

  const actions = useMemo(
    () => ({
      setTocState,
      addEntry,
      setToc,
      expandAll,
      collapseAll,
      setEditMode,
      updateEntry,
      deleteEntry,
      toggleExpand,
      reset,
    }),
    [
      addEntry,
      setToc,
      expandAll,
      collapseAll,
      setEditMode,
      updateEntry,
      deleteEntry,
      toggleExpand,
      reset,
    ]
  );

  return (
    <TocActionsContext.Provider value={actions}>
      <TocStateContext.Provider value={tocState}>{children}</TocStateContext.Provider>
    </TocActionsContext.Provider>
  );
};

const useTocStateContext = () => {
  const context = useContext(TocStateContext);
  if (!context) throw new Error('ToC state context not found');
  return context;
};

const useTocActionsContext = () => {
  const context = useContext(TocActionsContext);
  if (!context) throw new Error('ToC actions context not found');
  return context;
};

const useToc = () => useTocStateContext();

const useTocActions = () => {
  const { setTocState, ...actions } = useTocActionsContext();
  return actions;
};

const useTocStateActions = () => useTocActionsContext();

export { TocProvider, useToc, useTocActions, useTocStateActions };
