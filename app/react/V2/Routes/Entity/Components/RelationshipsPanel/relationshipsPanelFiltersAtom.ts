import { atom } from 'jotai';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';

const relationshipsPanelSearchAtom = atom('');
const relationshipsPanelSortAtom = atom<RelationshipsPanelSort>('appearance');

export { relationshipsPanelSearchAtom, relationshipsPanelSortAtom };
