import React from 'react';
import { useSetAtom } from 'jotai';
import { useSearchParams } from 'react-router';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { FunnelIcon } from '@heroicons/react/24/solid';
import { filterSidepanelAtom } from './filterSidepanelAtom.js';

const FilterSidepanelButton = () => {
  const setOpen = useSetAtom(filterSidepanelAtom);
  const [searchParams] = useSearchParams();
  const activeFilters = Array.from(searchParams.entries()).filter(([key]) => key !== 'page').length;
  return (
    <Button
      className="flex items-center gap-2 leading-4 text-ink-secondary"
      variant="ghost"
      onClick={() => setOpen(true)}
    >
      <FunnelIcon
        className={`mr-2 inline w-4 ${activeFilters > 0 ? 'text-(--color-theme-action-primary)' : 'text-ink-secondary'} `}
      />
      <Translate>Filters</Translate>
      {activeFilters > 0 && (
        <span className="px-3 py-[2px] ml-2 text-xs text-white rounded-md bg-primary-900">
          {activeFilters}
        </span>
      )}
    </Button>
  );
};

export { FilterSidepanelButton };
