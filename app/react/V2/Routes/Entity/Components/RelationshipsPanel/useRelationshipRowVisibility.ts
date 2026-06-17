import { useRelationshipsPanelFilters } from '../EntityScopedProvider.js';

const useRelationshipRowVisibility = () => {
  const { groupBy } = useRelationshipsPanelFilters();

  return {
    hideTargetPill: groupBy === 'target-entity',
    hideTemplateName: groupBy === 'target-template',
    hideRelationType: groupBy === 'relation-type',
  };
};

export { useRelationshipRowVisibility };
