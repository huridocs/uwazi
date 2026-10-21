import type { EntitySchema } from '#shared/types/entityType.js';
import type { LibraryFacetIcon } from '#shared/types/librarySearch.js';

const libraryFacetIcon = (icon?: EntitySchema['icon']): LibraryFacetIcon | undefined => {
  if (!icon?._id) return undefined;
  return {
    _id: icon._id,
    ...(icon.type ? { type: icon.type } : {}),
    ...(icon.label ? { label: icon.label } : {}),
  };
};

export { libraryFacetIcon };
