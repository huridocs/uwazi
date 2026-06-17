import {
  type RelationshipsPanelZoom,
  useRelationshipsPanelFilters,
} from '#V2/Routes/Entity/Components/context/index.js';

const rowPaddingByZoom: Partial<Record<RelationshipsPanelZoom, string>> = {
  overview: '!py-1.5',
  compact: '!py-2',
};

const useRelationshipsPanelZoom = () => {
  const { zoom } = useRelationshipsPanelFilters();

  return {
    zoom,
    compact: zoom === 'compact',
    overview: zoom === 'overview',
    rowPadding: rowPaddingByZoom[zoom],
  };
};

export { useRelationshipsPanelZoom };
