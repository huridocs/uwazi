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
  useRelationshipsPanelLayout,
} from '#V2/Routes/Entity/Components/context/index.js';

const viewOptions: { id: RelationshipsPanelView; label: string; Icon: typeof LayoutListIcon }[] = [
  { id: 'list', label: t('System', 'List', null, false), Icon: LayoutListIcon },
  { id: 'tree', label: t('System', 'Tree', null, false), Icon: ListTreeIcon },
  { id: 'graph', label: t('System', 'Graph', null, false), Icon: NetworkIcon },
];

const RelationshipsViewControl = () => {
  const { view, setView } = useRelationshipsPanelLayout();

  return (
    <SegmentedControl
      value={view}
      onChange={setView}
      ariaLabel={t('System', 'View', null, false)}
      size="md"
      options={viewOptions.map(option => ({
        id: option.id,
        title: option.label,
        Icon: option.Icon,
      }))}
    />
  );
};

export { RelationshipsViewControl };
