import { useAtomValue } from 'jotai';
import { relationshipsPanelEntityAtom } from './relationshipsPanelDataAtoms.js';

const useRelationshipsPanelEntity = () => useAtomValue(relationshipsPanelEntityAtom);

export { useRelationshipsPanelEntity };
