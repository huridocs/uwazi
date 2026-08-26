import { useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { relationshipTypesAtom } from '#V2/atoms/index.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { filterAndSortMarkers } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import {
  useDocumentRelationshipNav,
  useEnsureResolved,
  useRelationshipsPanelFacetFilters,
  useRelationshipsPanelFilterInputs,
  useRelationshipsPanelSearch,
  useRelationshipsPanelUi,
} from '#V2/Routes/Entity/Components/context/index.js';
import {
  activateDocumentCluster,
  getMarkerRefIds,
  toggleClusterIfActive,
} from './documentPdfClusterUtils.js';
import { useEntityTabNavigation } from '../EntityTabsContext.js';

type UseDocumentPdfRelationshipClicksParams = {
  entity?: EntityType;
  mainPdfController: PDFControls | null | undefined;
  activeClusterRefIds: string[] | null;
  setActiveClusterRefIds: (ids: string[] | null) => void;
  findMarkerById: (relationshipId: string) => RelationshipMarker | undefined;
  selectRelationship: (
    marker: RelationshipMarker,
    options?: { scrollPanel?: boolean }
  ) => Promise<void>;
  clearRelationshipSelection: () => void;
};

const useDocumentPdfRelationshipClicks = ({
  entity,
  mainPdfController,
  activeClusterRefIds,
  setActiveClusterRefIds,
  findMarkerById,
  selectRelationship,
  clearRelationshipSelection,
}: UseDocumentPdfRelationshipClicksParams) => {
  const ensureResolved = useEnsureResolved();
  const { setRelTypeFilters, setEntityTypeFilters } = useRelationshipsPanelFacetFilters();
  const { setSearch } = useRelationshipsPanelSearch();
  const { setExpandForRefId } = useRelationshipsPanelUi();
  const { setScrollToRelationshipPanel } = useDocumentRelationshipNav();
  const filterInputs = useRelationshipsPanelFilterInputs();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const { focusRelationshipsPanel } = useEntityTabNavigation();

  const clearVisibilityFilters = useCallback(() => {
    setActiveClusterRefIds(null);
    setRelTypeFilters({});
    setEntityTypeFilters({});
    setSearch('');
  }, [setActiveClusterRefIds, setEntityTypeFilters, setRelTypeFilters, setSearch]);

  const clearFacetFilters = useCallback(() => {
    setRelTypeFilters({});
    setEntityTypeFilters({});
    setSearch('');
  }, [setEntityTypeFilters, setRelTypeFilters, setSearch]);

  const isMarkerDisplayed = useCallback(
    (marker: RelationshipMarker): boolean =>
      filterAndSortMarkers([marker], {
        searchQuery: filterInputs.search,
        sortOrder: filterInputs.sort,
        selfSharedId: entity?.sharedId ?? '',
        relationshipTypeName: typeId =>
          relationshipTypes.find(type => type._id === typeId)?.name ?? '',
        relTypeFilters: filterInputs.relTypeFilters,
        entityTypeFilters: filterInputs.entityTypeFilters,
        activeClusterRefIds: filterInputs.activeClusterRefIds,
      }).length > 0,
    [entity?.sharedId, filterInputs, relationshipTypes]
  );

  const handleRailPointClick = useCallback(
    (marker: RelationshipMarker) => {
      if (!entity) return;
      if (!isMarkerDisplayed(marker)) clearVisibilityFilters();
      focusRelationshipsPanel();
      selectRelationship(marker, { scrollPanel: true }).catch(() => undefined);
    },
    [clearVisibilityFilters, entity, focusRelationshipsPanel, isMarkerDisplayed, selectRelationship]
  );

  const handleClusterClick = useCallback(
    async (markers: RelationshipMarker[]) => {
      if (!entity || markers.length === 0) return;
      const clusterPage = markers[0]?.anchor?.selections?.[0]?.page;
      if (!clusterPage) return;

      const ids = getMarkerRefIds(markers);
      if (
        toggleClusterIfActive(activeClusterRefIds, ids, () => {
          setActiveClusterRefIds(null);
          clearRelationshipSelection();
        })
      ) {
        return;
      }

      await activateDocumentCluster({
        ids,
        clusterPage,
        setActiveClusterRefIds,
        clearRelationshipSelection,
        focusRelationshipsPanel,
        mainPdfController,
        ensureResolved,
      });
    },
    [
      activeClusterRefIds,
      clearRelationshipSelection,
      ensureResolved,
      entity,
      focusRelationshipsPanel,
      mainPdfController,
      setActiveClusterRefIds,
    ]
  );

  const handleClusterMoreClick = useCallback(
    (markers: RelationshipMarker[]) => {
      if (!entity || markers.length === 0) return;
      const clusterPage = markers[0]?.anchor?.selections?.[0]?.page;
      const ids = getMarkerRefIds(markers);
      clearFacetFilters();
      setActiveClusterRefIds(ids);
      clearRelationshipSelection();
      focusRelationshipsPanel();
      if (clusterPage) mainPdfController?.goToPage(clusterPage);
      ensureResolved().catch(() => undefined);
    },
    [
      clearFacetFilters,
      clearRelationshipSelection,
      ensureResolved,
      entity,
      focusRelationshipsPanel,
      mainPdfController,
      setActiveClusterRefIds,
    ]
  );

  const handleHighlightClick = useCallback(
    (relationshipId: string) => {
      const marker = findMarkerById(relationshipId);
      if (marker) {
        focusRelationshipsPanel();
        selectRelationship(marker, { scrollPanel: true }).catch(() => undefined);
        return;
      }
      focusRelationshipsPanel();
      setScrollToRelationshipPanel(relationshipId);
      setExpandForRefId(relationshipId);
    },
    [
      findMarkerById,
      focusRelationshipsPanel,
      selectRelationship,
      setExpandForRefId,
      setScrollToRelationshipPanel,
    ]
  );

  return { handleRailPointClick, handleClusterClick, handleClusterMoreClick, handleHighlightClick };
};

export { useDocumentPdfRelationshipClicks };
