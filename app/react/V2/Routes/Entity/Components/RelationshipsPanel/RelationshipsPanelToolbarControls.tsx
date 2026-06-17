import React from 'react';
import { useAtomValue } from 'jotai';
import { FilterDrawerButton } from '#V2/Components/UI/FilterDrawerButton.js';
import {
  relationshipsPanelGroupByAtom,
  relationshipsPanelViewAtom,
} from './relationshipsPanelFiltersAtom.js';
import { RelationshipsGroupByControl } from './RelationshipsGroupByControl.js';
import { RelationshipsSortControl } from './RelationshipsSortControl.js';
import { RelationshipsViewControl } from './RelationshipsViewControl.js';
import { RelationshipsZoomControl } from './RelationshipsZoomControl.js';

type RelationshipsPanelToolbarControlsProps = {
  activeFilterCount: number;
  onOpenFilters: () => void;
};

const RelationshipsPanelToolbarControls = ({
  activeFilterCount,
  onOpenFilters,
}: RelationshipsPanelToolbarControlsProps) => {
  const view = useAtomValue(relationshipsPanelViewAtom);
  const groupBy = useAtomValue(relationshipsPanelGroupByAtom);
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
      <div className="flex min-w-fit flex-1 items-center justify-end gap-1.5">
        <RelationshipsZoomControl disabled={zoomDisabled} />
        <FilterDrawerButton activeCount={activeFilterCount} onClick={onOpenFilters} />
      </div>
    </div>
  );
};

export { RelationshipsPanelToolbarControls };
