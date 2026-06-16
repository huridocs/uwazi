import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { FiltersDrawer } from '#V2/Components/UI/index.js';
import { RelationshipsFilterDrawerContent } from './RelationshipsFilterDrawerContent.js';
import {
  relationshipsPanelActiveFilterCountAtom,
  relationshipsPanelClearFiltersAtom,
  relationshipsPanelFiltersDrawerOpenAtom,
} from './relationshipsPanelFiltersAtom.js';

const RelationshipsFiltersDrawer = () => {
  const [filtersOpen, setFiltersOpen] = useAtom(relationshipsPanelFiltersDrawerOpenAtom);
  const activeFilterCount = useAtomValue(relationshipsPanelActiveFilterCountAtom);
  const clearAllFilters = useSetAtom(relationshipsPanelClearFiltersAtom);

  return (
    <FiltersDrawer
      open={filtersOpen}
      onClose={() => setFiltersOpen(false)}
      footer={
        activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={() => clearAllFilters()}
            className="cursor-pointer text-[11px] font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            <Translate>Clear all filters</Translate>
          </button>
        ) : null
      }
    >
      <RelationshipsFilterDrawerContent />
    </FiltersDrawer>
  );
};

export { RelationshipsFiltersDrawer };
