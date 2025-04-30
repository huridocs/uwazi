import React from 'react';
import { useSetAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { FunnelIcon } from '@heroicons/react/24/solid';
import { filterSidepanelAtom } from './filterSidepanelAtom';

const FilterSidepanelButton = ({ activeFilters = 0 }: { activeFilters?: number }) => {
  const setOpen = useSetAtom(filterSidepanelAtom);

  return (
    <Button
      className="flex items-center gap-2 leading-4 text-gray-800"
      styling="light"
      onClick={() => setOpen(true)}
    >
      <FunnelIcon
        className={`inline w-4 mr-2 ${activeFilters > 0 ? 'text-primary-900' : 'text-gray-800'} `}
      />
      <Translate>Stats & Filters</Translate>
      {activeFilters > 0 && (
        <span className="px-3 py-[2px] ml-2 text-xs text-white rounded-md bg-primary-900">
          {activeFilters}
        </span>
      )}
    </Button>
  );
};

export { FilterSidepanelButton };
