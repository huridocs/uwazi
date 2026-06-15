import React from 'react';
import { useAtom } from 'jotai';
import { Bars3BottomLeftIcon, ShareIcon, QueueListIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { SegmentedControl } from '#V2/Components/UI/SegmentedControl.js';
import {
  relationshipsPanelViewAtom,
  type RelationshipsPanelView,
} from './relationshipsPanelFiltersAtom.js';

const options: { id: RelationshipsPanelView; label: string; Icon: typeof QueueListIcon }[] = [
  { id: 'list', label: 'List', Icon: Bars3BottomLeftIcon },
  { id: 'tree', label: 'Tree', Icon: QueueListIcon },
  { id: 'graph', label: 'Graph', Icon: ShareIcon },
];

const RelationshipsViewControls = () => {
  const [view, setView] = useAtom(relationshipsPanelViewAtom);

  return (
    <SegmentedControl
      value={view}
      onChange={setView}
      ariaLabel={t('System', 'View', null, false)}
      showLabels
      options={options.map(option => ({
        id: option.id,
        title: option.label,
        Icon: option.Icon,
        label: <Translate>{option.label}</Translate>,
      }))}
    />
  );
};

export { RelationshipsViewControls };
