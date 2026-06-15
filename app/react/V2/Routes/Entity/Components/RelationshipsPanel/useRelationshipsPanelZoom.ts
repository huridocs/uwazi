import { useAtomValue } from 'jotai';
import { relationshipsPanelZoomAtom } from './relationshipsPanelFiltersAtom.js';

const useRelationshipsPanelZoom = () => {
  const zoom = useAtomValue(relationshipsPanelZoomAtom);
  const compact = zoom === 'compact';
  const overview = zoom === 'overview';

  const rowPadding = (() => {
    if (overview) return '!py-1.5';
    if (compact) return '!py-2';
    return undefined;
  })();

  return {
    compact,
    overview,
    rowPadding,
    metaHidden: overview,
    snippetLines: compact ? 1 : 2,
  };
};

export { useRelationshipsPanelZoom };
