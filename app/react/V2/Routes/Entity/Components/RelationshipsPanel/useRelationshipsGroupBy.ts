import { useEffect } from 'react';
import { useAtom } from 'jotai';
import {
  relationshipsPanelGroupByAtom,
  relationshipsPanelSubGroupByAtom,
} from './relationshipsPanelFiltersAtom.js';

const useRelationshipsGroupBy = () => {
  const [groupBy] = useAtom(relationshipsPanelGroupByAtom);
  const [subGroupBy, setSubGroupBy] = useAtom(relationshipsPanelSubGroupByAtom);

  useEffect(() => {
    if (groupBy !== 'none' && subGroupBy === groupBy) setSubGroupBy('none');
  }, [groupBy, subGroupBy, setSubGroupBy]);

  return { groupBy, subGroupBy };
};

export { useRelationshipsGroupBy };
