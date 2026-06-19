import { useCallback, useEffect } from 'react';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { projectRelationshipMarkers } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import {
  useDocumentRelationshipNav,
  useRelationshipsPanelFacetFilters,
  useRelationshipsPanelUi,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useActiveRelationshipHighlight } from '#V2/Routes/Entity/Components/document/index.js';
import { getMarkerRefIds, toggleClusterIfActive } from './documentPdfClusterUtils.js';
import { useEntityTabNavigation } from './useEntityTabNavigation.js';

type UseDocumentPdfRelationshipHandlersParams = {
  entity?: EntityType;
  mainPdfController: PDFControls | null | undefined;
};

function useDocumentPdfRelationshipHandlers({
  entity,
  mainPdfController,
}: UseDocumentPdfRelationshipHandlersParams) {
  const { setScrollToRelationshipPanel } = useDocumentRelationshipNav();
  const { activeClusterRefIds, setActiveClusterRefIds } = useRelationshipsPanelFacetFilters();
  const { setExpandForRefId } = useRelationshipsPanelUi();
  const { activeRelationshipId, selectRelationship, clearRelationshipSelection } =
    useActiveRelationshipHighlight();
  const { focusRelationshipsPanel } = useEntityTabNavigation();

  useEffect(
    () => () => {
      setActiveClusterRefIds(null);
    },
    [entity?.sharedId, setActiveClusterRefIds]
  );

  const findMarkerById = useCallback(
    (relationshipId: string): RelationshipMarker | undefined => {
      if (!entity) return undefined;
      return projectRelationshipMarkers(entity).find(marker => marker._id === relationshipId);
    },
    [entity]
  );

  const handleRailPointClick = useCallback(
    (marker: RelationshipMarker) => {
      if (!entity) return;
      focusRelationshipsPanel();
      selectRelationship(marker, { scrollPanel: true });
    },
    [entity, focusRelationshipsPanel, selectRelationship]
  );

  const handleClusterClick = useCallback(
    (markers: RelationshipMarker[]) => {
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

      setActiveClusterRefIds(ids);
      focusRelationshipsPanel();
      mainPdfController?.goToPage(clusterPage);
    },
    [
      activeClusterRefIds,
      clearRelationshipSelection,
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
        selectRelationship(marker, { scrollPanel: true });
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

  return {
    activeRelationshipId,
    handleRailPointClick,
    handleClusterClick,
    handleHighlightClick,
  };
}

export { useDocumentPdfRelationshipHandlers };
