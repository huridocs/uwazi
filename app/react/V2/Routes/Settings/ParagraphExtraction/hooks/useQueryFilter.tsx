import { useSearchParams } from 'react-router-dom';
import { PXEntityQuery } from '../types';

const validFilterKeys = ['page', 'sort', 'status', 'language'];

const useQueryFilter = () => {
  const [filters, setQueryFilters] = useSearchParams();

  const page = filters.get('page');
  const sort = filters.get('sort');
  const filter = filters.get('filter');

  const setFilters = (newFilters: PXEntityQuery) => {
    console.log(newFilters);
    const filterParam = {
      page,
      sort,
      filters: JSON.stringify({
        ...(filter ? JSON.parse(filter) : {}),
        ...newFilters,
      }),
    };

    setQueryFilters(filterParam);
  };

  return { filters, setFilters };
};

export { useQueryFilter };
