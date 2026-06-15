import { atom } from 'jotai';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import type { RelationshipsPanelGroupBy } from '#V2/formatters/relationships/relationshipsPanelGrouping.js';

type RelationshipsPanelView = 'list' | 'tree' | 'graph';
type RelationshipsPanelZoom = 'detail' | 'compact' | 'overview';

const relationshipsPanelSearchAtom = atom('');
const relationshipsPanelSortAtom = atom<RelationshipsPanelSort>('appearance');
const relationshipsPanelGroupByAtom = atom<RelationshipsPanelGroupBy>('none');
const relationshipsPanelSubGroupByAtom = atom<RelationshipsPanelGroupBy>('none');
const relationshipsPanelViewAtom = atom<RelationshipsPanelView>('list');
const relationshipsPanelZoomAtom = atom<RelationshipsPanelZoom>('detail');
const relationshipsPanelExpandAllSignalAtom = atom(0);
const relationshipsPanelCollapseAllSignalAtom = atom(0);
const relationshipsPanelRelTypeFiltersAtom = atom<Record<string, boolean>>({});
const relationshipsPanelEntityTypeFiltersAtom = atom<Record<string, boolean>>({});
const relationshipsPanelActiveClusterRefIdsAtom = atom<string[] | null>(null);
const relationshipsPanelFiltersDrawerOpenAtom = atom(false);
const relationshipsPanelExpandForRefIdAtom = atom<string | null>(null);

const relationshipsPanelClearFiltersAtom = atom(null, (_get, set) => {
  set(relationshipsPanelRelTypeFiltersAtom, {});
  set(relationshipsPanelEntityTypeFiltersAtom, {});
  set(relationshipsPanelSearchAtom, '');
  set(relationshipsPanelSortAtom, 'none');
  set(relationshipsPanelActiveClusterRefIdsAtom, null);
});

const relationshipsPanelActiveFilterCountAtom = atom(get => {
  let count = 0;
  if (get(relationshipsPanelSearchAtom).trim()) count += 1;
  if (get(relationshipsPanelSortAtom) !== 'none') count += 1;
  count += Object.values(get(relationshipsPanelRelTypeFiltersAtom)).filter(Boolean).length;
  count += Object.values(get(relationshipsPanelEntityTypeFiltersAtom)).filter(Boolean).length;
  if (get(relationshipsPanelActiveClusterRefIdsAtom)) count += 1;
  return count;
});

export type { RelationshipsPanelView, RelationshipsPanelZoom };
export {
  relationshipsPanelSearchAtom,
  relationshipsPanelSortAtom,
  relationshipsPanelGroupByAtom,
  relationshipsPanelSubGroupByAtom,
  relationshipsPanelViewAtom,
  relationshipsPanelZoomAtom,
  relationshipsPanelExpandAllSignalAtom,
  relationshipsPanelCollapseAllSignalAtom,
  relationshipsPanelRelTypeFiltersAtom,
  relationshipsPanelEntityTypeFiltersAtom,
  relationshipsPanelActiveClusterRefIdsAtom,
  relationshipsPanelFiltersDrawerOpenAtom,
  relationshipsPanelExpandForRefIdAtom,
  relationshipsPanelClearFiltersAtom,
  relationshipsPanelActiveFilterCountAtom,
};
