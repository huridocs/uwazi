import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  RelationshipsPanelGroupBy,
  RelationshipsPanelSort,
  RelationshipsPanelView,
  RelationshipsPanelZoom,
} from './types.js';

type SearchSlice = { search: string; setSearch: React.Dispatch<React.SetStateAction<string>> };
type SortSlice = {
  sort: RelationshipsPanelSort;
  setSort: React.Dispatch<React.SetStateAction<RelationshipsPanelSort>>;
};
type LayoutSlice = {
  view: RelationshipsPanelView;
  zoom: RelationshipsPanelZoom;
  groupBy: RelationshipsPanelGroupBy;
  subGroupBy: RelationshipsPanelGroupBy;
  setView: React.Dispatch<React.SetStateAction<RelationshipsPanelView>>;
  setZoom: React.Dispatch<React.SetStateAction<RelationshipsPanelZoom>>;
  setGroupBy: (groupBy: RelationshipsPanelGroupBy) => void;
  setSubGroupBy: React.Dispatch<React.SetStateAction<RelationshipsPanelGroupBy>>;
};
type FacetFiltersSlice = {
  relTypeFilters: Record<string, boolean>;
  entityTypeFilters: Record<string, boolean>;
  activeClusterRefIds: string[] | null;
  setRelTypeFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setEntityTypeFilters: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setActiveClusterRefIds: React.Dispatch<React.SetStateAction<string[] | null>>;
  clearFilters: () => void;
  activeFilterCount: number;
};
type UiSlice = {
  expandAllSignal: number;
  collapseAllSignal: number;
  filtersDrawerOpen: boolean;
  expandForRefId: string | null;
  setExpandAllSignal: React.Dispatch<React.SetStateAction<number>>;
  setCollapseAllSignal: React.Dispatch<React.SetStateAction<number>>;
  setFiltersDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setExpandForRefId: React.Dispatch<React.SetStateAction<string | null>>;
};

const SearchContext = createContext<SearchSlice | null>(null);
const SortContext = createContext<SortSlice | null>(null);
const LayoutContext = createContext<LayoutSlice | null>(null);
const FacetFiltersContext = createContext<FacetFiltersSlice | null>(null);
const UiContext = createContext<UiSlice | null>(null);

const RelationshipsPanelFiltersProvider = ({ children }: { children: React.ReactNode }) => {
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count += 1;
    if (sort !== 'none') count += 1;
    count += Object.values(relTypeFilters).filter(Boolean).length;
    count += Object.values(entityTypeFilters).filter(Boolean).length;
    if (activeClusterRefIds) count += 1;
    return count;
  }, [search, sort, relTypeFilters, entityTypeFilters, activeClusterRefIds]);

  const searchSlice = useMemo(() => ({ search, setSearch }), [search]);
  const sortSlice = useMemo(() => ({ sort, setSort }), [sort]);
  const layoutSlice = useMemo(
    () => ({ view, zoom, groupBy, subGroupBy, setView, setZoom, setGroupBy, setSubGroupBy }),
    [view, zoom, groupBy, subGroupBy, setGroupBy]
  );
  const facetSlice = useMemo(
    () => ({
      relTypeFilters,
      entityTypeFilters,
      activeClusterRefIds,
      setRelTypeFilters,
      setEntityTypeFilters,
      setActiveClusterRefIds,
      clearFilters,
      activeFilterCount,
    }),
    [relTypeFilters, entityTypeFilters, activeClusterRefIds, clearFilters, activeFilterCount]
  );
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

  return (
    <SearchContext.Provider value={searchSlice}>
      <SortContext.Provider value={sortSlice}>
        <LayoutContext.Provider value={layoutSlice}>
          <FacetFiltersContext.Provider value={facetSlice}>
            <UiContext.Provider value={uiSlice}>{children}</UiContext.Provider>
          </FacetFiltersContext.Provider>
        </LayoutContext.Provider>
      </SortContext.Provider>
    </SearchContext.Provider>
  );
};

const useSearchSlice = () => {
  const context = useContext(SearchContext);
  if (!context) throw new Error('Relationships panel search context not found');
  return context;
};

const useSortSlice = () => {
  const context = useContext(SortContext);
  if (!context) throw new Error('Relationships panel sort context not found');
  return context;
};

const useLayoutSlice = () => {
  const context = useContext(LayoutContext);
  if (!context) throw new Error('Relationships panel layout context not found');
  return context;
};

const useFacetFiltersSlice = () => {
  const context = useContext(FacetFiltersContext);
  if (!context) throw new Error('Relationships panel facet filters context not found');
  return context;
};

const useUiSlice = () => {
  const context = useContext(UiContext);
  if (!context) throw new Error('Relationships panel UI context not found');
  return context;
};

const useRelationshipsPanelSearch = () => useSearchSlice();
const useRelationshipsPanelSort = () => useSortSlice();
const useRelationshipsPanelLayout = () => useLayoutSlice();
const useRelationshipsPanelFacetFilters = () => useFacetFiltersSlice();
const useRelationshipsPanelUi = () => useUiSlice();

const useRelationshipsPanelFilterInputs = () => {
  const { search } = useSearchSlice();
  const { sort } = useSortSlice();
  const { groupBy, subGroupBy } = useLayoutSlice();
  const { relTypeFilters, entityTypeFilters, activeClusterRefIds } = useFacetFiltersSlice();
  return {
    search,
    sort,
    groupBy,
    subGroupBy,
    relTypeFilters,
    entityTypeFilters,
    activeClusterRefIds,
  };
};

const useRelationshipsPanelFilters = () => {
  const { search, setSearch } = useSearchSlice();
  const { sort, setSort } = useSortSlice();
  const { view, zoom, groupBy, subGroupBy, setView, setZoom, setGroupBy, setSubGroupBy } =
    useLayoutSlice();
  const {
    relTypeFilters,
    entityTypeFilters,
    activeClusterRefIds,
    setRelTypeFilters,
    setEntityTypeFilters,
    setActiveClusterRefIds,
    clearFilters,
    activeFilterCount,
  } = useFacetFiltersSlice();
  const {
    expandAllSignal,
    collapseAllSignal,
    filtersDrawerOpen,
    expandForRefId,
    setExpandAllSignal,
    setCollapseAllSignal,
    setFiltersDrawerOpen,
    setExpandForRefId,
  } = useUiSlice();

  return {
    search,
    setSearch,
    sort,
    setSort,
    groupBy,
    subGroupBy,
    setGroupBy,
    setSubGroupBy,
    view,
    setView,
    zoom,
    setZoom,
    expandAllSignal,
    setExpandAllSignal,
    collapseAllSignal,
    setCollapseAllSignal,
    relTypeFilters,
    setRelTypeFilters,
    entityTypeFilters,
    setEntityTypeFilters,
    activeClusterRefIds,
    setActiveClusterRefIds,
    filtersDrawerOpen,
    setFiltersDrawerOpen,
    expandForRefId,
    setExpandForRefId,
    clearFilters,
    activeFilterCount,
  };
};

export {
  RelationshipsPanelFiltersProvider,
  useRelationshipsPanelSearch,
  useRelationshipsPanelSort,
  useRelationshipsPanelLayout,
  useRelationshipsPanelFacetFilters,
  useRelationshipsPanelUi,
  useRelationshipsPanelFilterInputs,
  useRelationshipsPanelFilters,
};
