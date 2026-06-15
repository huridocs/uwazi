import { useAtomValue } from 'jotai';
import { relationshipsPanelGroupByAtom } from './relationshipsPanelFiltersAtom.js';

const useRelationshipRowVisibility = () => {
  const groupBy = useAtomValue(relationshipsPanelGroupByAtom);

  return {
    hideTargetPill: groupBy === 'target-entity',
    hideTemplateName: groupBy === 'target-template',
    hideRelationType: groupBy === 'relation-type',
  };
};

export { useRelationshipRowVisibility };
