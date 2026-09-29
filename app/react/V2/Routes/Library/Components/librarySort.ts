import type { LibrarySortOrder } from '../libraryUrlState.js';
import type { LibraryTableColumnDef } from './libraryTableColumns.js';

type LibrarySortOption = {
  value: string;
  label: string;
  translationContext: string;
};

const effectiveLibrarySort = (sort: string) => sort || 'creationDate';

const nextLibrarySort = (
  currentSort: string,
  currentOrder: LibrarySortOrder,
  nextSort: string
): { sort: string; order: LibrarySortOrder } => {
  if (nextSort === effectiveLibrarySort(currentSort)) {
    return { sort: nextSort, order: currentOrder === 'asc' ? 'desc' : 'asc' };
  }
  return { sort: nextSort, order: 'asc' };
};

const librarySortOptions = (
  columns: Pick<LibraryTableColumnDef, 'sortKey' | 'label' | 'translationContext'>[],
  searchTerm = '',
  currentSort = ''
): LibrarySortOption[] => {
  const options: LibrarySortOption[] = [];
  const seen = new Set<string>();

  columns.forEach(column => {
    if (!column.sortKey || seen.has(column.sortKey)) {
      return;
    }
    seen.add(column.sortKey);
    options.push({
      value: column.sortKey,
      label: column.label,
      translationContext: column.translationContext ?? 'System',
    });
  });

  if (searchTerm.trim() || currentSort === '_score') {
    options.push({
      value: '_score',
      label: 'Relevance',
      translationContext: 'System',
    });
  }

  return options;
};

export type { LibrarySortOption };
export { effectiveLibrarySort, librarySortOptions, nextLibrarySort };
