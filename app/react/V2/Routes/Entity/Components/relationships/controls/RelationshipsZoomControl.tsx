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
  useRelationshipsPanelLayout,
} from '#V2/Routes/Entity/Components/context/index.js';

const zoomOptions: {
  id: RelationshipsPanelZoom;
  label: string;
  Icon: typeof LayoutListIcon;
}[] = [
  { id: 'detail', label: t('System', 'Detail', null, false), Icon: LayoutListIcon },
  { id: 'compact', label: t('System', 'Compact', null, false), Icon: Rows3Icon },
  { id: 'overview', label: t('System', 'Overview', null, false), Icon: CircleDotIcon },
];

type RelationshipsZoomControlProps = {
  disabled?: boolean;
};

const RelationshipsZoomControl = ({ disabled = false }: RelationshipsZoomControlProps) => {
  const { zoom, setZoom } = useRelationshipsPanelLayout();

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
