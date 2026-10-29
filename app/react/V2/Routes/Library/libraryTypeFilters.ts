import type { ClientSettingsFilterSchema, Template } from '#app/apiResponseTypes.js';

type LibraryTypeFilterChild = {
  id: string;
  name: string;
};

type LibraryTypeFilterItem = LibraryTypeFilterChild & {
  items?: LibraryTypeFilterChild[];
};

const featuredTypeItems = (filters: ClientSettingsFilterSchema[] = []): LibraryTypeFilterItem[] =>
  filters.flatMap(filter => {
    const id = filter.id || filter.name;
    if (!id) {
      return [];
    }
    const items = (filter.items ?? [])
      .filter((item): item is { id: string; name?: string } => Boolean(item.id))
      .map(item => ({ id: item.id, name: item.name || item.id }));
    return [
      {
        id,
        name: filter.name || id,
        ...(items.length ? { items } : {}),
      },
    ];
  });

const allTypeItems = (templates: Template[]): LibraryTypeFilterItem[] =>
  [...templates]
    .map(template => ({ id: template._id, name: template.name }))
    .sort((left, right) => left.name.localeCompare(right.name));

type TypeFilterScope = 'featured' | 'all';

const configuredTypeIds = (filters: ClientSettingsFilterSchema[] | undefined): string[] =>
  featuredTypeItems(filters).flatMap(item => [
    item.id,
    ...(item.items?.map(child => child.id) ?? []),
  ]);

const typeFilterItems = (
  settingsFilters: ClientSettingsFilterSchema[] | undefined,
  templates: Template[],
  scope: TypeFilterScope = 'featured'
): LibraryTypeFilterItem[] => {
  const featured = featuredTypeItems(settingsFilters);
  if (scope === 'featured' && featured.length) {
    return featured;
  }
  return allTypeItems(templates);
};

const toggleTypeGroup = (selected: string[], childIds: string[]): string[] => {
  const allSelected = childIds.length > 0 && childIds.every(id => selected.includes(id));
  if (allSelected) {
    return selected.filter(id => !childIds.includes(id));
  }
  return [...new Set([...selected, ...childIds])];
};

export { configuredTypeIds, toggleTypeGroup, typeFilterItems };
export type { LibraryTypeFilterChild, LibraryTypeFilterItem, TypeFilterScope };
