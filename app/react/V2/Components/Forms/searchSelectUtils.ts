import type { SearchSelectGroup, SearchSelectOption } from './SearchSelect.js';

const normalizeSearch = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const flattenSearchSelectOptions = (
  options: SearchSelectOption[] = [],
  groups: SearchSelectGroup[] = []
): SearchSelectOption[] => {
  const fromGroups = groups.flatMap(group =>
    group.options.map(option => ({
      ...option,
      group: group.label,
    }))
  );

  return [...options, ...fromGroups];
};

const filterSearchSelectOptions = (
  options: SearchSelectOption[],
  search: string
): SearchSelectOption[] => {
  if (!search) {
    return options;
  }

  const normalizedSearch = normalizeSearch(search);

  return options.filter(option => normalizeSearch(option.searchLabel).includes(normalizedSearch));
};

const groupSearchSelectOptions = (
  options: SearchSelectOption[]
): { label: string; options: SearchSelectOption[] }[] => {
  const groups = new Map<string, SearchSelectOption[]>();

  options.forEach(option => {
    const groupLabel = option.group ?? '';
    const current = groups.get(groupLabel) ?? [];
    current.push(option);
    groups.set(groupLabel, current);
  });

  return Array.from(groups.entries()).map(([label, groupOptions]) => ({
    label,
    options: groupOptions,
  }));
};

export {
  normalizeSearch,
  flattenSearchSelectOptions,
  filterSearchSelectOptions,
  groupSearchSelectOptions,
};
