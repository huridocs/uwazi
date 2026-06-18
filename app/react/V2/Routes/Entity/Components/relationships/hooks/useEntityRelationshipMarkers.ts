import { useMemo } from 'react';
import { projectRelationshipMarkers } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import { useEntityScopedEntity } from '#V2/Routes/Entity/Components/context/EntityContext.js';

const useEntityRelationshipMarkers = () => {
  const entity = useEntityScopedEntity();
  return useMemo(() => projectRelationshipMarkers(entity), [entity]);
};

export { useEntityRelationshipMarkers };
