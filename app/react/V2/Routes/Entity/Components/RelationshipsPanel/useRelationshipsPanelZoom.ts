import { useAtomValue } from 'jotai';
import {
  relationshipsPanelZoomAtom,
  type RelationshipsPanelZoom,
} from './relationshipsPanelFiltersAtom.js';

const rowPaddingByZoom: Partial<Record<RelationshipsPanelZoom, string>> = {
  overview: '!py-1.5',
  compact: '!py-2',
};

const useRelationshipsPanelZoom = () => {
  const zoom = useAtomValue(relationshipsPanelZoomAtom);

  return {
    zoom,
    compact: zoom === 'compact',
    overview: zoom === 'overview',
    rowPadding: rowPaddingByZoom[zoom],
  };
};

export { useRelationshipsPanelZoom };
