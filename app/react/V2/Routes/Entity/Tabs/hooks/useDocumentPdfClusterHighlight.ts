import { useCallback, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { Entity as EntityType } from '#V2/api/entities/types.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  filterMarkersForDocument,
  projectRelationshipMarkers,
} from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import {
  useEntityLanguage,
  useRelationshipsPanelFacetFilters,
  useDirectedRelationships,
} from '#V2/Routes/Entity/Components/context/index.js';
import { clusterMarkersToHighlights } from './documentPdfClusterUtils.js';

type UseDocumentPdfClusterHighlightParams = {
  entity?: EntityType;
  mainPdfController: PDFControls | null | undefined;
};

const useDocumentPdfClusterHighlight = ({
  entity,
  mainPdfController,
}: UseDocumentPdfClusterHighlightParams) => {
  const { mainDocument } = useEntityLanguage();
  const relationships = useDirectedRelationships();
  const { activeClusterRefIds, setActiveClusterRefIds } = useRelationshipsPanelFacetFilters();
  const templates = useAtomValue(templatesAtom);

  useEffect(
    () => () => {
      setActiveClusterRefIds(null);
    },
    [entity?.sharedId, setActiveClusterRefIds]
  );

  const findMarkerById = useCallback(
    (relationshipId: string): RelationshipMarker | undefined => {
      if (!entity) return undefined;
      return filterMarkersForDocument(
        projectRelationshipMarkers(entity.sharedId, relationships),
        mainDocument?._id,
        entity.sharedId
      ).find(marker => marker._id === relationshipId);
    },
    [entity, mainDocument?._id, relationships]
  );

  const colorOf = useCallback(
    (marker: RelationshipMarker) =>
      templates.find(template => template._id === marker.target.templateId)?.color || '#A4CAFE',
    [templates]
  );

  const syncClusterHighlights = useCallback(
    (markers: RelationshipMarker[]) => {
      mainPdfController?.toggleHighlights(clusterMarkersToHighlights(markers, colorOf));
    },
    [colorOf, mainPdfController]
  );

  useEffect(() => {
    if (!activeClusterRefIds?.length || !mainPdfController || !entity) return;
    const liveMarkers = activeClusterRefIds.flatMap(id => {
      const marker = findMarkerById(id);
      return marker ? [marker] : [];
    });
    if (liveMarkers.length === 0) return;
    syncClusterHighlights(liveMarkers);
  }, [
    activeClusterRefIds,
    entity,
    findMarkerById,
    mainPdfController,
    relationships,
    syncClusterHighlights,
  ]);

  return { activeClusterRefIds, setActiveClusterRefIds, findMarkerById };
};

export { useDocumentPdfClusterHighlight };
