import { useCallback, useMemo, useState } from 'react';
import type {
  RelationshipsPanelGroupBy,
  RelationshipsPanelSort,
  RelationshipsPanelView,
  RelationshipsPanelZoom,
} from './types.js';

const useRelationshipsPanelFilterSlices = () => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RelationshipsPanelSort>('appearance');
  const [groupBy, setGroupByState] = useState<RelationshipsPanelGroupBy>('none');
  const [subGroupBy, setSubGroupBy] = useState<RelationshipsPanelGroupBy>('none');
  const [view, setView] = useState<RelationshipsPanelView>('list');
  const [zoom, setZoom] = useState<RelationshipsPanelZoom>('detail');
  const [relTypeFilters, setRelTypeFilters] = useState<Record<string, boolean>>({});
  const [entityTypeFilters, setEntityTypeFilters] = useState<Record<string, boolean>>({});
  const [activeClusterRefIds, setActiveClusterRefIds] = useState<string[] | null>(null);
  const [expandAllSignal, setExpandAllSignal] = useState(0);
  const [collapseAllSignal, setCollapseAllSignal] = useState(0);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);
  const [expandForRefId, setExpandForRefId] = useState<string | null>(null);

  const setGroupBy = useCallback((nextGroupBy: RelationshipsPanelGroupBy) => {
    setGroupByState(nextGroupBy);
    setSubGroupBy(current =>
      nextGroupBy !== 'none' && current === nextGroupBy ? 'none' : current
    );
  }, []);

  const clearFilters = useCallback(() => {
    setRelTypeFilters({});
    setEntityTypeFilters({});
    setSearch('');
    setSort('none');
    setActiveClusterRefIds(null);
  }, []);

  const searchAndSortSlices = useMemo(
    () => ({
      searchSlice: { search, setSearch },
      sortSlice: { sort, setSort },
    }),
    [search, sort]
  );
  const layoutSlice = useMemo(
    () => ({ view, zoom, groupBy, subGroupBy, setView, setZoom, setGroupBy, setSubGroupBy }),
    [view, zoom, groupBy, subGroupBy, setGroupBy]
  );
  const facetSlice = useMemo(() => {
    let activeFilterCount = 0;
    if (search.trim()) activeFilterCount += 1;
    if (sort !== 'none') activeFilterCount += 1;
    activeFilterCount += Object.values(relTypeFilters).filter(Boolean).length;
    activeFilterCount += Object.values(entityTypeFilters).filter(Boolean).length;
    if (activeClusterRefIds) activeFilterCount += 1;
    return {
      relTypeFilters,
      entityTypeFilters,
      activeClusterRefIds,
      setRelTypeFilters,
      setEntityTypeFilters,
      setActiveClusterRefIds,
      clearFilters,
      activeFilterCount,
    };
  }, [search, sort, relTypeFilters, entityTypeFilters, activeClusterRefIds, clearFilters]);
  const uiSlice = useMemo(
    () => ({
      expandAllSignal,
      collapseAllSignal,
      filtersDrawerOpen,
      expandForRefId,
      setExpandAllSignal,
      setCollapseAllSignal,
      setFiltersDrawerOpen,
      setExpandForRefId,
    }),
    [expandAllSignal, collapseAllSignal, filtersDrawerOpen, expandForRefId]
  );

  return {
    searchSlice: searchAndSortSlices.searchSlice,
    sortSlice: searchAndSortSlices.sortSlice,
    layoutSlice,
    facetSlice,
    uiSlice,
  };
};

export { useRelationshipsPanelFilterSlices };
