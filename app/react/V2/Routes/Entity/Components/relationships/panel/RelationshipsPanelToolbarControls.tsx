import React from 'react';
import { FilterDrawerButton } from '#V2/Components/UI/FilterDrawerButton.js';
import { RelationshipsGroupByControl } from '../controls/RelationshipsGroupByControl.js';
import { RelationshipsSortControl } from '../controls/RelationshipsSortControl.js';
import { RelationshipsViewControl } from '../controls/RelationshipsViewControl.js';
import { RelationshipsZoomControl } from '../controls/RelationshipsZoomControl.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';

type RelationshipsPanelToolbarControlsProps = {
  activeFilterCount: number;
  onOpenFilters: () => void;
};

const RelationshipsPanelToolbarControls = ({
  activeFilterCount,
  onOpenFilters,
}: RelationshipsPanelToolbarControlsProps) => {
  const { view, groupBy } = useRelationshipsPanelLayout();
  const zoomDisabled = view === 'graph';

  return (
    <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
        <RelationshipsViewControl />
        <RelationshipsGroupByControl axis="primary" />
        <RelationshipsGroupByControl
          axis="secondary"
          disabled={groupBy === 'none'}
          excludeOption={groupBy !== 'none' ? groupBy : undefined}
        />
        <RelationshipsSortControl />
      </div>
      <div className="flex min-w-fit flex-1 items-center justify-start gap-1.5">
        <RelationshipsZoomControl disabled={zoomDisabled} />
        <FilterDrawerButton activeCount={activeFilterCount} onClick={onOpenFilters} />
      </div>
    </div>
  );
};

export { RelationshipsPanelToolbarControls };
