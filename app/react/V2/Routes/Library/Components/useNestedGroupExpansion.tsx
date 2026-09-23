import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type NestedGroupsExpansion = {
  generation: number;
  open: boolean;
};

const NestedGroupsExpansionContext = createContext<NestedGroupsExpansion>({
  generation: 0,
  open: false,
});

const useNestedGroupsExpansionControls = () => {
  const [expansion, setExpansion] = useState<NestedGroupsExpansion>({
    generation: 0,
    open: false,
  });

  const expandAll = useCallback(() => {
    setExpansion(current => ({ generation: current.generation + 1, open: true }));
  }, []);

  const collapseAll = useCallback(() => {
    setExpansion(current => ({ generation: current.generation + 1, open: false }));
  }, []);

  return { expansion, expandAll, collapseAll };
};

const NestedGroupsExpansionProvider = ({
  value,
  children,
}: {
  value: NestedGroupsExpansion;
  children: ReactNode;
}) => (
  <NestedGroupsExpansionContext.Provider value={value}>
    {children}
  </NestedGroupsExpansionContext.Provider>
);

const useNestedGroupExpansion = (groupIds: string[], initiallyExpandedIds: string[] = []) => {
  const { generation, open } = useContext(NestedGroupsExpansionContext);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(initiallyExpandedIds.map(id => [id, true]))
  );
  const groupKey = groupIds.join('\0');

  useEffect(() => {
    if (generation === 0) {
      return;
    }
    const ids = groupKey.length ? groupKey.split('\0') : [];
    setExpanded(open ? Object.fromEntries(ids.map(id => [id, true])) : {});
  }, [generation, open, groupKey]);

  const toggleExpanded = useCallback((id: string) => {
    setExpanded(current => ({ ...current, [id]: !current[id] }));
  }, []);

  return { expanded, toggleExpanded };
};

export { NestedGroupsExpansionProvider, useNestedGroupExpansion, useNestedGroupsExpansionControls };
export type { NestedGroupsExpansion };
