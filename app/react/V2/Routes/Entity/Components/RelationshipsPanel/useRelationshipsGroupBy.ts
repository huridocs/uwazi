import { useAtomValue } from 'jotai';
import {
  relationshipsPanelGroupByAtom,
  relationshipsPanelSubGroupByAtom,
} from './relationshipsPanelFiltersAtom.js';

const useRelationshipsGroupBy = () => ({
  groupBy: useAtomValue(relationshipsPanelGroupByAtom),
  subGroupBy: useAtomValue(relationshipsPanelSubGroupByAtom),
});

export { useRelationshipsGroupBy };
