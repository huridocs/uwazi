/* eslint-disable @typescript-eslint/no-unused-vars */
import { Translate } from 'app/I18N';
import React, { Dispatch, SetStateAction, useState } from 'react';

type EntityFilterProps = {
  filterGroups: { [key: string]: number };
  setFilters: Dispatch<SetStateAction<{ [key: string]: boolean; }>>;
  loadedFilters: { [key: string]: boolean };
};

const EntityFilter = ({ filterGroups, setFilters, loadedFilters }: EntityFilterProps) => {


  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-lg  shadow-sm">
        <h2 className="text-sm font-semibold font-roboto text-gray-900 mb-3"><Translate>Status</Translate></h2>
        <div className="flex flex-col gap-2">
          {Object.entries(filterGroups).map(([status, count]) => (
            <label key={status} className="flex items-center">
              <input
                type="checkbox"
                checked={loadedFilters[status] || false}
                onChange={e => setFilters({ ...loadedFilters, [status]: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-3 flex flex-1 justify-between items-center text-sm text-gray-600">
                <span className="text-xs font-roboto">
                  <Translate>{status}</Translate>
                </span>
                <div className="border-b border-dashed border-gray-[#E8E7EC] mx-2 flex-grow" />
                <span className="text-xs font-roboto font-bold">{count}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export { EntityFilter };
