import { atom } from 'jotai';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import type { RelationshipsPanelGroupBy } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';

const relationshipsPanelSearchAtom = atom('');
const relationshipsPanelSortAtom = atom<RelationshipsPanelSort>('appearance');
const relationshipsPanelGroupByAtom = atom<RelationshipsPanelGroupBy>('none');
const relationshipsPanelSubGroupByAtom = atom<RelationshipsPanelGroupBy>('none');
const relationshipsPanelExpandAllSignalAtom = atom(0);
const relationshipsPanelCollapseAllSignalAtom = atom(0);

export {
  relationshipsPanelSearchAtom,
  relationshipsPanelSortAtom,
  relationshipsPanelGroupByAtom,
  relationshipsPanelSubGroupByAtom,
  relationshipsPanelExpandAllSignalAtom,
  relationshipsPanelCollapseAllSignalAtom,
};
