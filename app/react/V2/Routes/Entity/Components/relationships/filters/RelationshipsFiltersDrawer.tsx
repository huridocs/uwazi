import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { FiltersDrawer } from '#V2/Components/UI/index.js';
import { RelationshipsFilterDrawerContent } from './RelationshipsFilterDrawerContent.js';
import { useRelationshipsPanelFilters } from '../../context/EntityScopedProvider.js';

const RelationshipsFiltersDrawer = () => {
  const { filtersDrawerOpen, setFiltersDrawerOpen, activeFilterCount, clearFilters } =
    useRelationshipsPanelFilters();

  return (
    <FiltersDrawer
      open={filtersDrawerOpen}
      onClose={() => setFiltersDrawerOpen(false)}
      footer={
        activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={() => clearFilters()}
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
