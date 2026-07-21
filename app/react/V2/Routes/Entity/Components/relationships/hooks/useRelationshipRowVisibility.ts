import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';

const useRelationshipRowVisibility = () => {
  const { groupBy, subGroupBy } = useRelationshipsPanelLayout();

  return {
    hideTargetPill: groupBy === 'target-entity' || subGroupBy === 'target-entity',
    hideTemplateName: groupBy === 'target-template' || subGroupBy === 'target-template',
    hideRelationType: groupBy === 'relation-type' || subGroupBy === 'relation-type',
  };
};

export { useRelationshipRowVisibility };
