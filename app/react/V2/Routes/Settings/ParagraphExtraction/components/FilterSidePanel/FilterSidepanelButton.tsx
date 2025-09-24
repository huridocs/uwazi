import React from 'react';
import { useSetAtom } from 'jotai';
import { useSearchParams } from 'react-router';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button } from '../../V2/Components/UI.js';
import { FunnelIcon } from '@heroicons/react/24/solid';
import { filterSidepanelAtom } from './filterSidepanelAtom';

const FilterSidepanelButton = () => {
  const setOpen = useSetAtom(filterSidepanelAtom);
  const [searchParams] = useSearchParams();
  const activeFilters = Array.from(searchParams.entries()).filter(([key]) => key !== 'page').length;
  return (
    <Button
      className="flex items-center gap-2 leading-4 text-gray-800"
      styling="light"
      onClick={() => setOpen(true)}
    >
      <FunnelIcon
        className={`inline w-4 mr-2 ${activeFilters > 0 ? 'text-primary-900' : 'text-gray-800'} `}
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
