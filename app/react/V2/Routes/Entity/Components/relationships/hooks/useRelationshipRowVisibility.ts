import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';

const useRelationshipRowVisibility = () => {
  const { groupBy } = useRelationshipsPanelLayout();

  return {
    hideTargetPill: groupBy === 'target-entity',
    hideTemplateName: groupBy === 'target-template',
    hideRelationType: groupBy === 'relation-type',
  };
};

export { useRelationshipRowVisibility };
