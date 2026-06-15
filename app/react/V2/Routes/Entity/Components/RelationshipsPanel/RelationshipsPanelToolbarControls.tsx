import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import {
  Bars3BottomLeftIcon,
  Bars3Icon,
  Bars4Icon,
  EllipsisHorizontalCircleIcon,
  QueueListIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { SegmentedControl } from '#V2/Components/UI/SegmentedControl.js';
import { DropdownListbox } from '#V2/Components/UI/DropdownListbox.js';
import { FiltersButton } from '#V2/Components/UI/FiltersButton.js';
import type { RelationshipsPanelSort } from '#V2/formatters/relationships/relationshipsPanelProjection.js';
import {
  groupingOptions,
  type RelationshipsPanelGroupBy,
} from '#V2/formatters/relationships/relationshipsPanelGrouping.js';
import {
  relationshipsPanelGroupByAtom,
  relationshipsPanelSubGroupByAtom,
  relationshipsPanelViewAtom,
  relationshipsPanelZoomAtom,
  relationshipsPanelSortAtom,
  type RelationshipsPanelView,
  type RelationshipsPanelZoom,
} from './relationshipsPanelFiltersAtom.js';
import { sortOptionLabels, groupingOptionLabels } from './relationshipsPanelLabels.js';

const viewOptions: { id: RelationshipsPanelView; label: string; Icon: typeof QueueListIcon }[] = [
  { id: 'list', label: 'List', Icon: Bars3BottomLeftIcon },
  { id: 'tree', label: 'Tree', Icon: QueueListIcon },
  { id: 'graph', label: 'Graph', Icon: ShareIcon },
];

const zoomOptions: {
  id: RelationshipsPanelZoom;
  label: string;
  Icon: typeof Bars4Icon;
}[] = [
  { id: 'detail', label: 'Detail', Icon: Bars4Icon },
  { id: 'compact', label: 'Compact', Icon: Bars3Icon },
  { id: 'overview', label: 'Overview', Icon: EllipsisHorizontalCircleIcon },
];

const sortOptionIds: RelationshipsPanelSort[] = ['none', 'appearance', 'asc', 'desc'];

type GroupByControlProps = {
  axis: 'primary' | 'secondary';
  disabled?: boolean;
  excludeOption?: RelationshipsPanelGroupBy;
};

const GroupByControl = ({ axis, disabled = false, excludeOption }: GroupByControlProps) => {
  const [groupBy, setGroupBy] = useAtom(relationshipsPanelGroupByAtom);
  const [subGroupBy, setSubGroupBy] = useAtom(relationshipsPanelSubGroupByAtom);
  const value = axis === 'primary' ? groupBy : subGroupBy;
  const setValue = axis === 'primary' ? setGroupBy : setSubGroupBy;
  const visibleOptions = groupingOptions.filter(
    option => option.id === 'none' || option.id !== excludeOption
  );

  return (
    <DropdownListbox
      prefix={
        axis === 'primary' ? <Translate>Group by:</Translate> : <Translate>Then by:</Translate>
      }
      value={value}
      disabled={disabled}
      minWidthClass="min-w-[180px]"
      listAriaLabel={
        axis === 'primary'
          ? t('System', 'Group by:', null, false)
          : t('System', 'Then by:', null, false)
      }
      onChange={id => {
        if (axis === 'primary' && id !== 'none' && subGroupBy === id) {
          setSubGroupBy('none');
        }
        setValue(id);
      }}
      options={visibleOptions.map(option => ({
        id: option.id,
        label: <Translate>{groupingOptionLabels[option.id]}</Translate>,
      }))}
    />
  );
};

type RelationshipsPanelToolbarControlsProps = {
  activeFilterCount: number;
  onOpenFilters: () => void;
};

const RelationshipsPanelToolbarControls = ({
  activeFilterCount,
  onOpenFilters,
}: RelationshipsPanelToolbarControlsProps) => {
  const [view, setView] = useAtom(relationshipsPanelViewAtom);
  const [zoom, setZoom] = useAtom(relationshipsPanelZoomAtom);
  const [sortOrder, setSortOrder] = useAtom(relationshipsPanelSortAtom);
  const groupBy = useAtomValue(relationshipsPanelGroupByAtom);
  const zoomDisabled = view === 'graph' || (view === 'list' && groupBy === 'none');

  return (
    <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <SegmentedControl
          value={view}
          onChange={setView}
          ariaLabel={t('System', 'View', null, false)}
          showLabels
          options={viewOptions.map(option => ({
            id: option.id,
            title: option.label,
            Icon: option.Icon,
            label: <Translate>{option.label}</Translate>,
          }))}
        />
        <GroupByControl axis="primary" />
        <GroupByControl
          axis="secondary"
          disabled={groupBy === 'none'}
          excludeOption={groupBy !== 'none' ? groupBy : undefined}
        />
        <DropdownListbox
          prefix={<Translate>Sort:</Translate>}
          value={sortOrder}
          onChange={setSortOrder}
          listAriaLabel={t('System', 'Sort order', null, false)}
          options={sortOptionIds.map(id => ({
            id,
            label: <Translate>{sortOptionLabels[id]}</Translate>,
          }))}
        />
      </div>
      <div className="flex min-w-fit flex-1 items-center justify-end gap-1.5">
        <SegmentedControl
          value={zoom}
          onChange={setZoom}
          ariaLabel={t('System', 'Row density', null, false)}
          disabled={zoomDisabled}
          options={zoomOptions.map(option => ({
            id: option.id,
            title: option.label,
            Icon: option.Icon,
          }))}
        />
        <FiltersButton activeCount={activeFilterCount} onClick={onOpenFilters} />
      </div>
    </div>
  );
};

export { RelationshipsPanelToolbarControls };
