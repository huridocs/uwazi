import React from 'react';
import { t } from '#app/I18N/index.js';
import {
  LayoutListIcon,
  ListTreeIcon,
  NetworkIcon,
} from '#V2/Components/CustomIcons/RelationshipsPanelIcons.js';
import { SegmentedControl } from '#V2/Components/UI/SegmentedControl/index.js';
import {
  type RelationshipsPanelView,
  useRelationshipsPanelFilters,
} from '../../context/EntityScopedProvider.js';

const viewOptions: { id: RelationshipsPanelView; label: string; Icon: typeof LayoutListIcon }[] = [
  { id: 'list', label: 'List', Icon: LayoutListIcon },
  { id: 'tree', label: 'Tree', Icon: ListTreeIcon },
  { id: 'graph', label: 'Graph', Icon: NetworkIcon },
];

const RelationshipsViewControl = () => {
  const { view, setView } = useRelationshipsPanelFilters();

  return (
    <SegmentedControl
      value={view}
      onChange={setView}
      ariaLabel={t('System', 'View', null, false)}
      options={viewOptions.map(option => ({
        id: option.id,
        title: option.label,
        Icon: option.Icon,
      }))}
    />
  );
};

export { RelationshipsViewControl };
