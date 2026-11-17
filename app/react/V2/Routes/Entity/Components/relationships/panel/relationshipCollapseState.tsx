import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type CollapseRegistry = {
  report: (id: string, expanded: boolean) => void;
  remove: (id: string) => void;
};

type CollapseSummary = {
  hasSections: boolean;
  allExpanded: boolean;
  allCollapsed: boolean;
};

const CollapseRegistryContext = createContext<CollapseRegistry | null>(null);
const CollapseSummaryContext = createContext<CollapseSummary | null>(null);

const RelationshipCollapseStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [sections, setSections] = useState<ReadonlyMap<string, boolean>>(() => new Map());
  const report = useCallback((id: string, expanded: boolean) => {
    setSections(current => {
      if (current.get(id) === expanded) return current;
      const next = new Map(current);
      next.set(id, expanded);
      return next;
    });
  }, []);
  const remove = useCallback((id: string) => {
    setSections(current => {
      if (!current.has(id)) return current;
      const next = new Map(current);
      next.delete(id);
      return next;
    });
  }, []);
  const registry = useMemo(() => ({ report, remove }), [report, remove]);
  const summary = useMemo(() => {
    const open = [...sections.values()];
    const hasSections = open.length > 0;
    return {
      hasSections,
      allExpanded: hasSections && open.every(Boolean),
      allCollapsed: hasSections && open.every(value => !value),
    };
  }, [sections]);

  return (
    <CollapseRegistryContext.Provider value={registry}>
      <CollapseSummaryContext.Provider value={summary}>{children}</CollapseSummaryContext.Provider>
    </CollapseRegistryContext.Provider>
  );
};

const useRelationshipCollapseRegistry = () => useContext(CollapseRegistryContext);

const useRelationshipCollapseSummary = () =>
  useContext(CollapseSummaryContext) ?? {
    hasSections: false,
    allExpanded: false,
    allCollapsed: false,
  };

export {
  RelationshipCollapseStateProvider,
  useRelationshipCollapseRegistry,
  useRelationshipCollapseSummary,
};
