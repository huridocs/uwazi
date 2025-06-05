import { SortingState } from '@tanstack/react-table';

export const updateSortingUrl = (
  sorting: SortingState,
  currentPath: string,
  currentSearchParams: URLSearchParams
): string => {
  const searchParams = new URLSearchParams(currentSearchParams);

  if (currentSearchParams.has('sort') && !sorting.length) {
    searchParams.delete('sort');
    return `${currentPath}?${searchParams.toString()}`;
  }

  if (sorting.length && sorting[0].id) {
    const property = sorting[0].id;
    const order = sorting[0].desc ? 'desc' : 'asc';
    searchParams.set('sort', `{"property":"${property}","order":"${order}"}`);
  }

  return `${currentPath}?${searchParams.toString()}`;
};
