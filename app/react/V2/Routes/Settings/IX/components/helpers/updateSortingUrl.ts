import { SortingState } from '@tanstack/react-table';

const SORTABLE_PROPERTIES = ['entityTitle', 'segment', 'currentValue'];

export const updateSortingUrl = (
  sorting: SortingState,
  currentPath: string,
  currentSearchParams: URLSearchParams
): string => {
  const newSearchParams = new URLSearchParams(currentSearchParams);

  if (sorting.length && sorting[0].id) {
    const property = sorting[0].id;

    if (!SORTABLE_PROPERTIES.includes(property)) {
      return `${currentPath}?${currentSearchParams.toString()}`;
    }

    const order = sorting[0].desc ? 'desc' : 'asc';
    newSearchParams.set('sort', JSON.stringify({ property, order }));
  } else {
    newSearchParams.delete('sort');
  }

  return `${currentPath}?${newSearchParams.toString()}`;
};
