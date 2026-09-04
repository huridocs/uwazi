import { useEffect, useMemo, useRef } from 'react';
import {
  filterMarkersForDocument,
  projectRelationshipMarkers,
} from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { useEntityScopedEntity } from '#V2/Routes/Entity/Components/context/EntityContext.js';
import { useEntityLanguage } from '#V2/Routes/Entity/Components/context/EntityLanguageContext.js';
import { useDirectedRelationships } from '#V2/Routes/Entity/Components/context/RelationshipsQueryProvider.js';
import { useRelationshipsPanelFacetFilters } from '#V2/Routes/Entity/Components/context/RelationshipsPanelFiltersContext.js';
import { useActiveRelationshipHighlight } from '#V2/Routes/Entity/Components/document/useActiveRelationshipHighlight.js';

const useEntityRelationshipMarkers = () => {
  const entity = useEntityScopedEntity();
  const relationships = useDirectedRelationships();
  const { mainDocument } = useEntityLanguage();
  return useMemo(
    () =>
      filterMarkersForDocument(
        projectRelationshipMarkers(entity.sharedId, relationships),
        mainDocument?._id,
        entity.sharedId
      ),
    [entity.sharedId, mainDocument?._id, relationships]
  );
};

const useResetRelationshipsOnDocumentChange = () => {
  const { mainDocument } = useEntityLanguage();
  const { clearFilters } = useRelationshipsPanelFacetFilters();
  const { clearRelationshipSelection } = useActiveRelationshipHighlight();
  const previousDocumentId = useRef(mainDocument?._id);

  useEffect(() => {
    if (previousDocumentId.current === mainDocument?._id) return;
    previousDocumentId.current = mainDocument?._id;
    clearFilters();
    clearRelationshipSelection();
  }, [mainDocument?._id, clearFilters, clearRelationshipSelection]);
};

export { useEntityRelationshipMarkers, useResetRelationshipsOnDocumentChange };
