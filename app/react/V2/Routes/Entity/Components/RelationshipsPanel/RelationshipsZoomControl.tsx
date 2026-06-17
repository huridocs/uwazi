import React from 'react';
import { t } from '#app/I18N/index.js';
import {
  CircleDotIcon,
  LayoutListIcon,
  Rows3Icon,
} from '#V2/Components/CustomIcons/RelationshipsPanelIcons.js';
import { SegmentedControl } from '#V2/Components/UI/SegmentedControl/index.js';
import {
  type RelationshipsPanelZoom,
  useRelationshipsPanelFilters,
} from '../EntityScopedProvider.js';

const zoomOptions: {
  id: RelationshipsPanelZoom;
  label: string;
  Icon: typeof LayoutListIcon;
}[] = [
  { id: 'detail', label: 'Detail', Icon: LayoutListIcon },
  { id: 'compact', label: 'Compact', Icon: Rows3Icon },
  { id: 'overview', label: 'Overview', Icon: CircleDotIcon },
];

type RelationshipsZoomControlProps = {
  disabled?: boolean;
};

const RelationshipsZoomControl = ({ disabled = false }: RelationshipsZoomControlProps) => {
  const { zoom, setZoom } = useRelationshipsPanelFilters();

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
