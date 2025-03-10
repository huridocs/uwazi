/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { useQueryFilter } from '../hooks/useQueryFilter';
import { PXEntityQuery } from '../types';

type EntityFilterProps = {
  filterGroups: any[];
  setFilters: (filters: Record<string, string | string[]>) => void;
};
// TODO:
// clear all filters
// get initial value from use query hook
// update checkboxes' checked depending on the search params
const EntityFilter = ({ filterGroups, setFilters }: EntityFilterProps) => {
  //   const { filters } = useQueryFilter();

  const [internalFilters, setInternalFilters] = useState<PXEntityQuery['filter']>({
    extractorId: '',
    status: [],
    languages: [],
  });
  const handleFilterChange = (isChecked: boolean, groupKey: string, optionKey: string) => {
    // const newFilter = {
    //   ...internalFilters,
    //   [groupKey]: [...(internalFilters[groupKey] || [])],
    // };
    // if (isChecked) {
    //   newFilter[groupKey].push(optionKey);
    // } else {
    //   newFilter[groupKey] = newFilter[groupKey].filter(key => key !== optionKey);
    // }
    // console.log(newFilter);
    // setInternalFilters({ ...internalFilters, ...newFilter });
  };

  return (
    <div className="flex flex-col gap-4">
      {filterGroups.map(group => (
        <div className="p-4 rounded-lg  shadow-sm" key={group.label}>
          <h2 className="text-sm font-semibold font-roboto text-gray-900 mb-3">{group.label}</h2>
          <div className="space-y-2">
            {group.options.map((option: any) => (
              <label key={option.label} className="flex items-center">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={e => {
                    handleFilterChange(e.target.checked, group.key, option.key);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-3 flex flex-1 justify-between items-center text-sm text-gray-600">
                  <span className="text-xs font-roboto">{option.label}</span>
                  <div className="border-b border-dashed border-gray-[#E8E7EC] mx-2 flex-grow" />
                  <span className="text-xs font-roboto font-bold">{option.count}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export { EntityFilter };
