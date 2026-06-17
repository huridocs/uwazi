import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import type { TextSelection } from '@huridocs/react-text-selection-handler';
import type { TocSchema } from '#shared/types/commonTypes.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import type { RelationshipView } from '#V2/formatters/relationships/types.js';
import {
  computeStats,
  filterAndSortMarkers,
  projectRelationshipsPanel,
  type RelationshipsPanelSort,
} from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import type { RelationshipsPanelGroupBy } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import { computeFacetCounts } from '#V2/formatters/relationships/relationshipsPanelFacets.js';
import { sortTocEntries } from './ToC/ToC.js';
import { findItemsWithChildren, normalizeToc } from './ToC/utils.js';

type ReferenceMode = 'entity' | 'text';
type RelationshipsPanelView = 'list' | 'tree' | 'graph';
type RelationshipsPanelZoom = 'detail' | 'compact' | 'overview';
type TocState = {
  toc: TocSchema[] | undefined;
  isEditMode: boolean;
  expanded: Record<number, boolean>;
  isAllExpanded: boolean;
  isAllCollapsed: boolean;
  isSaving: boolean;
};

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

type EntityScopedProviderProps = {
  entity: Entity;
  children: React.ReactNode;
};

type EntityScopedContextValue = {
  entity: Entity;
  relationships: RelationshipView[] | undefined;
  createReferenceSelection: TextSelection | undefined;
  createReferenceMode: ReferenceMode | undefined;
  relationshipsEditMode: boolean;
  selectedRelationshipIds: Set<string>;
  searchHintsModalOpen: boolean;
  pdfController: PDFControls | null;
  documentPdfSelection: TextSelection | undefined;
  activeRelationshipId: string | null;
  scrollToRelationshipPanel: string | null;
  relationshipsPanelSearch: string;
  relationshipsPanelSort: RelationshipsPanelSort;
  relationshipsPanelGroupBy: RelationshipsPanelGroupBy;
  relationshipsPanelSubGroupBy: RelationshipsPanelGroupBy;
  relationshipsPanelView: RelationshipsPanelView;
  relationshipsPanelZoom: RelationshipsPanelZoom;
  relationshipsPanelExpandAllSignal: number;
  relationshipsPanelCollapseAllSignal: number;
  relationshipsPanelRelTypeFilters: Record<string, boolean>;
  relationshipsPanelEntityTypeFilters: Record<string, boolean>;
  relationshipsPanelActiveClusterRefIds: string[] | null;
  relationshipsPanelFiltersDrawerOpen: boolean;
  relationshipsPanelExpandForRefId: string | null;
  metadataEditMode: boolean;
  tocState: TocState;
  setEntity: (entity: Entity) => void;
  setRelationships: (relationships: RelationshipView[] | undefined) => void;
  setCreateReferenceSelection: (selection: TextSelection | undefined, mode?: ReferenceMode) => void;
  deleteRelationship: (relationshipId: string) => void;
  resetRelationships: () => void;
  setRelationshipsEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedRelationshipIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSearchHintsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPdfController: React.Dispatch<React.SetStateAction<PDFControls | null>>;
  setDocumentPdfSelection: React.Dispatch<React.SetStateAction<TextSelection | undefined>>;
  setActiveRelationshipId: React.Dispatch<React.SetStateAction<string | null>>;
  setScrollToRelationshipPanel: React.Dispatch<React.SetStateAction<string | null>>;
  setRelationshipsPanelSearch: React.Dispatch<React.SetStateAction<string>>;
  setRelationshipsPanelSort: React.Dispatch<React.SetStateAction<RelationshipsPanelSort>>;
  setRelationshipsPanelGroupBy: (groupBy: RelationshipsPanelGroupBy) => void;
  setRelationshipsPanelSubGroupBy: React.Dispatch<React.SetStateAction<RelationshipsPanelGroupBy>>;
  setRelationshipsPanelView: React.Dispatch<React.SetStateAction<RelationshipsPanelView>>;
  setRelationshipsPanelZoom: React.Dispatch<React.SetStateAction<RelationshipsPanelZoom>>;
  setRelationshipsPanelExpandAllSignal: React.Dispatch<React.SetStateAction<number>>;
  setRelationshipsPanelCollapseAllSignal: React.Dispatch<React.SetStateAction<number>>;
  setRelationshipsPanelRelTypeFilters: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setRelationshipsPanelEntityTypeFilters: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setRelationshipsPanelActiveClusterRefIds: React.Dispatch<React.SetStateAction<string[] | null>>;
  setRelationshipsPanelFiltersDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setRelationshipsPanelExpandForRefId: React.Dispatch<React.SetStateAction<string | null>>;
  clearRelationshipsPanelFilters: () => void;
  setMetadataEditMode: React.Dispatch<React.SetStateAction<boolean>>;
  setTocState: React.Dispatch<React.SetStateAction<TocState>>;
  addTocEntry: (entry: TocSchema) => void;
  setToc: (toc: TocSchema[] | undefined) => void;
  expandTocAll: () => void;
  collapseTocAll: () => void;
  setTocEditMode: (enabled: boolean) => void;
  updateTocEntry: (index: number, entry: Partial<TocSchema>) => void;
  deleteTocEntry: (index: number) => void;
  toggleTocExpand: (index: number) => void;
  resetToc: () => void;
};

const EntityScopedContext = createContext<EntityScopedContextValue | null>(null);

const useEntityScopedContext = () => {
  const context = useContext(EntityScopedContext);
  if (!context) {
    throw new Error('Entity scoped context not found');
  }
  return context;
};

const EntityScopedProvider = ({ entity, children }: EntityScopedProviderProps) => {
  const [currentEntity, setEntity] = useState(entity);
  const [relationships, setRelationships] = useState<RelationshipView[] | undefined>();
  const [createReferenceSelection, setCreateReferenceSelectionState] = useState<TextSelection>();
  const [createReferenceMode, setCreateReferenceMode] = useState<ReferenceMode>();
  const [relationshipsEditMode, setRelationshipsEditMode] = useState(false);
  const [selectedRelationshipIds, setSelectedRelationshipIds] = useState(new Set<string>());
  const [searchHintsModalOpen, setSearchHintsModalOpen] = useState(false);
  const [pdfController, setPdfController] = useState<PDFControls | null>(null);
  const [documentPdfSelection, setDocumentPdfSelection] = useState<TextSelection>();
  const [activeRelationshipId, setActiveRelationshipId] = useState<string | null>(null);
  const [scrollToRelationshipPanel, setScrollToRelationshipPanel] = useState<string | null>(null);
  const [relationshipsPanelSearch, setRelationshipsPanelSearch] = useState('');
  const [relationshipsPanelSort, setRelationshipsPanelSort] =
    useState<RelationshipsPanelSort>('appearance');
  const [relationshipsPanelGroupBy, setRelationshipsPanelGroupByState] =
    useState<RelationshipsPanelGroupBy>('none');
  const [relationshipsPanelSubGroupBy, setRelationshipsPanelSubGroupBy] =
    useState<RelationshipsPanelGroupBy>('none');
  const [relationshipsPanelView, setRelationshipsPanelView] =
    useState<RelationshipsPanelView>('list');
  const [relationshipsPanelZoom, setRelationshipsPanelZoom] =
    useState<RelationshipsPanelZoom>('detail');
  const [relationshipsPanelExpandAllSignal, setRelationshipsPanelExpandAllSignal] = useState(0);
  const [relationshipsPanelCollapseAllSignal, setRelationshipsPanelCollapseAllSignal] = useState(0);
  const [relationshipsPanelRelTypeFilters, setRelationshipsPanelRelTypeFilters] = useState<
    Record<string, boolean>
  >({});
  const [relationshipsPanelEntityTypeFilters, setRelationshipsPanelEntityTypeFilters] = useState<
    Record<string, boolean>
  >({});
  const [relationshipsPanelActiveClusterRefIds, setRelationshipsPanelActiveClusterRefIds] =
    useState<string[] | null>(null);
  const [relationshipsPanelFiltersDrawerOpen, setRelationshipsPanelFiltersDrawerOpen] =
    useState(false);
  const [relationshipsPanelExpandForRefId, setRelationshipsPanelExpandForRefId] = useState<
    string | null
  >(null);
  const [metadataEditMode, setMetadataEditMode] = useState(false);
  const [tocState, setTocState] = useState(initialTocState);

  useEffect(() => {
    setEntity(entity);
  }, [entity]);

  const setCreateReferenceSelection = useCallback(
    (selection: TextSelection | undefined, mode?: ReferenceMode) => {
      setCreateReferenceSelectionState(selection);
      setCreateReferenceMode(mode);
    },
    []
  );

  const deleteRelationship = useCallback((relationshipId: string) => {
    setRelationships(current => current?.filter(item => item._id !== relationshipId));
  }, []);

  const resetRelationships = useCallback(() => {
    setRelationships(undefined);
    setCreateReferenceSelectionState(undefined);
    setCreateReferenceMode(undefined);
  }, []);

  const setRelationshipsPanelGroupBy = useCallback((groupBy: RelationshipsPanelGroupBy) => {
    setRelationshipsPanelGroupByState(groupBy);
    setRelationshipsPanelSubGroupBy(current =>
      groupBy !== 'none' && current === groupBy ? 'none' : current
    );
  }, []);

  const clearRelationshipsPanelFilters = useCallback(() => {
    setRelationshipsPanelRelTypeFilters({});
    setRelationshipsPanelEntityTypeFilters({});
    setRelationshipsPanelSearch('');
    setRelationshipsPanelSort('none');
    setRelationshipsPanelActiveClusterRefIds(null);
  }, []);

  const addTocEntry = useCallback((entry: TocSchema) => {
    setTocState(current => {
      const toc = sortTocEntries(current.toc ? [...current.toc, entry] : [entry]);
      return { ...current, toc, isEditMode: true, expanded: expandedChildren(toc) };
    });
  }, []);

  const setToc = useCallback((toc: TocSchema[] | undefined) => {
    setTocState(current => ({ ...current, toc }));
  }, []);

  const expandTocAll = useCallback(() => {
    setTocState(current => {
      if (!current.toc) return current;
      return { ...current, expanded: expandedChildren(current.toc) };
    });
  }, []);

  const collapseTocAll = useCallback(() => {
    setTocState(current => ({ ...current, expanded: {} }));
  }, []);

  const setTocEditMode = useCallback((enabled: boolean) => {
    setTocState(current => ({
      ...current,
      isEditMode: enabled,
      expanded: enabled && current.toc ? expandedChildren(current.toc) : current.expanded,
    }));
  }, []);

  const updateTocEntry = useCallback((index: number, entry: Partial<TocSchema>) => {
    setTocState(current => {
      if (!current.toc) return current;
      const toc = [...current.toc];
      toc[index] = { ...toc[index], ...entry };
      return { ...current, toc };
    });
  }, []);

  const deleteTocEntry = useCallback((index: number) => {
    setTocState(current => {
      if (!current.toc) return current;
      return { ...current, toc: current.toc.filter((_, itemIndex) => itemIndex !== index) };
    });
  }, []);

  const toggleTocExpand = useCallback((index: number) => {
    setTocState(current => ({
      ...current,
      expanded: { ...current.expanded, [index]: !current.expanded[index] },
    }));
  }, []);

  const resetToc = useCallback(() => {
    setTocState(initialTocState);
  }, []);

  const value = useMemo(
    () => ({
      entity: currentEntity,
      relationships,
      createReferenceSelection,
      createReferenceMode,
      relationshipsEditMode,
      selectedRelationshipIds,
      searchHintsModalOpen,
      pdfController,
      documentPdfSelection,
      activeRelationshipId,
      scrollToRelationshipPanel,
      relationshipsPanelSearch,
      relationshipsPanelSort,
      relationshipsPanelGroupBy,
      relationshipsPanelSubGroupBy,
      relationshipsPanelView,
      relationshipsPanelZoom,
      relationshipsPanelExpandAllSignal,
      relationshipsPanelCollapseAllSignal,
      relationshipsPanelRelTypeFilters,
      relationshipsPanelEntityTypeFilters,
      relationshipsPanelActiveClusterRefIds,
      relationshipsPanelFiltersDrawerOpen,
      relationshipsPanelExpandForRefId,
      metadataEditMode,
      tocState,
      setEntity,
      setRelationships,
      setCreateReferenceSelection,
      deleteRelationship,
      resetRelationships,
      setRelationshipsEditMode,
      setSelectedRelationshipIds,
      setSearchHintsModalOpen,
      setPdfController,
      setDocumentPdfSelection,
      setActiveRelationshipId,
      setScrollToRelationshipPanel,
      setRelationshipsPanelSearch,
      setRelationshipsPanelSort,
      setRelationshipsPanelGroupBy,
      setRelationshipsPanelSubGroupBy,
      setRelationshipsPanelView,
      setRelationshipsPanelZoom,
      setRelationshipsPanelExpandAllSignal,
      setRelationshipsPanelCollapseAllSignal,
      setRelationshipsPanelRelTypeFilters,
      setRelationshipsPanelEntityTypeFilters,
      setRelationshipsPanelActiveClusterRefIds,
      setRelationshipsPanelFiltersDrawerOpen,
      setRelationshipsPanelExpandForRefId,
      clearRelationshipsPanelFilters,
      setMetadataEditMode,
      setTocState,
      addTocEntry,
      setToc,
      expandTocAll,
      collapseTocAll,
      setTocEditMode,
      updateTocEntry,
      deleteTocEntry,
      toggleTocExpand,
      resetToc,
    }),
    [
      currentEntity,
      relationships,
      createReferenceSelection,
      createReferenceMode,
      relationshipsEditMode,
      selectedRelationshipIds,
      searchHintsModalOpen,
      pdfController,
      documentPdfSelection,
      activeRelationshipId,
      scrollToRelationshipPanel,
      relationshipsPanelSearch,
      relationshipsPanelSort,
      relationshipsPanelGroupBy,
      relationshipsPanelSubGroupBy,
      relationshipsPanelView,
      relationshipsPanelZoom,
      relationshipsPanelExpandAllSignal,
      relationshipsPanelCollapseAllSignal,
      relationshipsPanelRelTypeFilters,
      relationshipsPanelEntityTypeFilters,
      relationshipsPanelActiveClusterRefIds,
      relationshipsPanelFiltersDrawerOpen,
      relationshipsPanelExpandForRefId,
      metadataEditMode,
      tocState,
      setCreateReferenceSelection,
      deleteRelationship,
      resetRelationships,
      setRelationshipsPanelGroupBy,
      clearRelationshipsPanelFilters,
      addTocEntry,
      setToc,
      expandTocAll,
      collapseTocAll,
      setTocEditMode,
      updateTocEntry,
      deleteTocEntry,
      toggleTocExpand,
      resetToc,
    ]
  );

  return <EntityScopedContext.Provider value={value}>{children}</EntityScopedContext.Provider>;
};

const useEntityScopedEntity = () => useEntityScopedContext().entity;

const useDocumentInteraction = () => {
  const context = useEntityScopedContext();
  return {
    pdfController: context.pdfController,
    setPdfController: context.setPdfController,
    documentPdfSelection: context.documentPdfSelection,
    setDocumentPdfSelection: context.setDocumentPdfSelection,
    activeRelationshipId: context.activeRelationshipId,
    setActiveRelationshipId: context.setActiveRelationshipId,
    scrollToRelationshipPanel: context.scrollToRelationshipPanel,
    setScrollToRelationshipPanel: context.setScrollToRelationshipPanel,
    searchHintsModalOpen: context.searchHintsModalOpen,
    setSearchHintsModalOpen: context.setSearchHintsModalOpen,
  };
};

const useRelationships = () => {
  const context = useEntityScopedContext();
  return {
    relationships: context.relationships,
    createReferenceSelection: context.createReferenceSelection,
    createReferenceMode: context.createReferenceMode,
  };
};

const useRelationshipsActions = () => {
  const context = useEntityScopedContext();
  return {
    setRelationships: context.setRelationships,
    setCreateReferenceSelection: context.setCreateReferenceSelection,
    deleteRelationship: context.deleteRelationship,
    reset: context.resetRelationships,
  };
};

const useRelationshipsPanelFilters = () => {
  const context = useEntityScopedContext();
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (context.relationshipsPanelSearch.trim()) count += 1;
    if (context.relationshipsPanelSort !== 'none') count += 1;
    count += Object.values(context.relationshipsPanelRelTypeFilters).filter(Boolean).length;
    count += Object.values(context.relationshipsPanelEntityTypeFilters).filter(Boolean).length;
    if (context.relationshipsPanelActiveClusterRefIds) count += 1;
    return count;
  }, [
    context.relationshipsPanelActiveClusterRefIds,
    context.relationshipsPanelEntityTypeFilters,
    context.relationshipsPanelRelTypeFilters,
    context.relationshipsPanelSearch,
    context.relationshipsPanelSort,
  ]);

  return {
    search: context.relationshipsPanelSearch,
    setSearch: context.setRelationshipsPanelSearch,
    sort: context.relationshipsPanelSort,
    setSort: context.setRelationshipsPanelSort,
    groupBy: context.relationshipsPanelGroupBy,
    setGroupBy: context.setRelationshipsPanelGroupBy,
    subGroupBy: context.relationshipsPanelSubGroupBy,
    setSubGroupBy: context.setRelationshipsPanelSubGroupBy,
    view: context.relationshipsPanelView,
    setView: context.setRelationshipsPanelView,
    zoom: context.relationshipsPanelZoom,
    setZoom: context.setRelationshipsPanelZoom,
    expandAllSignal: context.relationshipsPanelExpandAllSignal,
    setExpandAllSignal: context.setRelationshipsPanelExpandAllSignal,
    collapseAllSignal: context.relationshipsPanelCollapseAllSignal,
    setCollapseAllSignal: context.setRelationshipsPanelCollapseAllSignal,
    relTypeFilters: context.relationshipsPanelRelTypeFilters,
    setRelTypeFilters: context.setRelationshipsPanelRelTypeFilters,
    entityTypeFilters: context.relationshipsPanelEntityTypeFilters,
    setEntityTypeFilters: context.setRelationshipsPanelEntityTypeFilters,
    activeClusterRefIds: context.relationshipsPanelActiveClusterRefIds,
    setActiveClusterRefIds: context.setRelationshipsPanelActiveClusterRefIds,
    filtersDrawerOpen: context.relationshipsPanelFiltersDrawerOpen,
    setFiltersDrawerOpen: context.setRelationshipsPanelFiltersDrawerOpen,
    expandForRefId: context.relationshipsPanelExpandForRefId,
    setExpandForRefId: context.setRelationshipsPanelExpandForRefId,
    clearFilters: context.clearRelationshipsPanelFilters,
    activeFilterCount,
  };
};

const useRelationshipsPanelData = () => {
  const entity = useEntityScopedEntity();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const filters = useRelationshipsPanelFilters();
  const sourceMarkers = useMemo(() => projectRelationshipsPanel(entity).markers, [entity]);
  const relationshipTypeName = useCallback(
    (typeId: string) => relationshipTypes.find(type => type._id === typeId)?.name ?? '',
    [relationshipTypes]
  );
  const markers = useMemo(
    () =>
      filterAndSortMarkers(sourceMarkers, {
        searchQuery: filters.search,
        sortOrder: filters.sort,
        relationshipTypeName,
        relTypeFilters: filters.relTypeFilters,
        entityTypeFilters: filters.entityTypeFilters,
        activeClusterRefIds: filters.activeClusterRefIds,
      }),
    [
      filters.activeClusterRefIds,
      filters.entityTypeFilters,
      filters.relTypeFilters,
      filters.search,
      filters.sort,
      relationshipTypeName,
      sourceMarkers,
    ]
  );
  const stats = useMemo(() => computeStats(markers), [markers]);
  const facetCounts = useMemo(() => computeFacetCounts(sourceMarkers), [sourceMarkers]);

  return {
    markers,
    sourceMarkers,
    stats,
    facetCounts,
    hasRelationships: sourceMarkers.length > 0,
  };
};

const useToc = () => useEntityScopedContext().tocState;

const useTocActions = () => {
  const context = useEntityScopedContext();
  return {
    addEntry: context.addTocEntry,
    setToc: context.setToc,
    expandAll: context.expandTocAll,
    collapseAll: context.collapseTocAll,
    setEditMode: context.setTocEditMode,
    updateEntry: context.updateTocEntry,
    deleteEntry: context.deleteTocEntry,
    toggleExpand: context.toggleTocExpand,
    reset: context.resetToc,
  };
};

const useMetadataEditing = () => {
  const context = useEntityScopedContext();
  return {
    isEditing: context.metadataEditMode,
    setIsEditing: context.setMetadataEditMode,
  };
};

export type { ReferenceMode, RelationshipsPanelView, RelationshipsPanelZoom };
export {
  EntityScopedProvider,
  useDocumentInteraction,
  useEntityScopedContext,
  useEntityScopedEntity,
  useRelationships,
  useRelationshipsActions,
  useRelationshipsPanelData,
  useRelationshipsPanelFilters,
  useMetadataEditing,
  useToc,
  useTocActions,
};
