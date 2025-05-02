import React, { useRef, useEffect, Dispatch, SetStateAction } from 'react';
import { Translate } from 'app/I18N';
import { EntityStatus } from 'V2/shared/ParagraphExtractionTypes';

type Filters = { [key: string]: { count: number; status: boolean } };

type EntityFilterProps = {
  filters: Filters;
  setFilters: Dispatch<SetStateAction<Filters>>;
};

const EntityFilter = ({ filters, setFilters }: EntityFilterProps) => {
  const filtersRef = useRef(filters);

  useEffect(() => {
    Object.entries(filters).forEach(([key]) => {
      if (filtersRef.current[key]) {
        // eslint-disable-next-line no-param-reassign
        filters[key].status = filtersRef.current[key].status;
      }
    });
    filtersRef.current = filters;
  }, [filters]);

  const handleCheckboxChange = (key: string, count: number, checked: boolean) => {
    const updatedFilters = {
      ...filtersRef.current,
      [key]: { count, status: checked },
    };
    filtersRef.current = updatedFilters;
    setFilters(updatedFilters);
  };

  const statusKeys: { [key in EntityStatus]: string } = {
    new: 'New',
    processing: 'Processing',
    obsolete: 'Obsolete',
    error: 'Error',
    processed: 'Processed',
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="p-4 rounded-lg  shadow-sm">
        <h2 className="text-sm font-semibold font-roboto text-gray-900 mb-3">
          <Translate>Status</Translate>
        </h2>
        <div className="flex flex-col gap-2">
          {Object.entries(filters).map(([key, { count, status }]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={status || false}
                onChange={e => handleCheckboxChange(key, count, Boolean(e.currentTarget.checked))}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-3 flex flex-1 justify-between items-center text-sm text-gray-600">
                <span className="text-xs font-roboto">
                  <Translate>{statusKeys[key as EntityStatus]}</Translate>
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

export type { Filters };
export { EntityFilter };
