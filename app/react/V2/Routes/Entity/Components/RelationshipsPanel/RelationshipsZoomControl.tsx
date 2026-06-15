import React from 'react';
import { useAtom } from 'jotai';
import { Bars3Icon, Bars4Icon, EllipsisHorizontalCircleIcon } from '@heroicons/react/24/outline';
import { t } from '#app/I18N/index.js';
import { SegmentedControl } from '#V2/Components/UI/SegmentedControl.js';
import {
  relationshipsPanelZoomAtom,
  type RelationshipsPanelZoom,
} from './relationshipsPanelFiltersAtom.js';

const zoomOptions: {
  id: RelationshipsPanelZoom;
  label: string;
  Icon: typeof Bars4Icon;
}[] = [
  { id: 'detail', label: 'Detail', Icon: Bars4Icon },
  { id: 'compact', label: 'Compact', Icon: Bars3Icon },
  { id: 'overview', label: 'Overview', Icon: EllipsisHorizontalCircleIcon },
];

type RelationshipsZoomControlProps = {
  disabled?: boolean;
};

const RelationshipsZoomControl = ({ disabled = false }: RelationshipsZoomControlProps) => {
  const [zoom, setZoom] = useAtom(relationshipsPanelZoomAtom);

  return (
    <SegmentedControl
      value={zoom}
      onChange={setZoom}
      ariaLabel={t('System', 'Row density', null, false)}
      disabled={disabled}
      options={zoomOptions.map(option => ({
        id: option.id,
        title: option.label,
        Icon: option.Icon,
      }))}
    />
  );
};

export { RelationshipsZoomControl };
