/* eslint-disable @typescript-eslint/no-unused-vars */
// import { useSearchParams } from 'react-router';
import { useState } from 'react';
import { PXEntityQuery } from '../types';

const validFilterKeys = ['page', 'sort', 'status', 'language'];

const useQueryFilter = () => {
  const [filters, setQueryFilters] = useState<string>();

  const setFilters = (newFilters: PXEntityQuery) => {
    console.log(newFilters);
    const filterParam = {
      filters: JSON.stringify({
        ...(filters ? JSON.parse(filters) : {}),
        ...newFilters,
      }),
    };

    // setQueryFilters(filterParam);
  };

  return { filters, setFilters };
};

export { useQueryFilter };
