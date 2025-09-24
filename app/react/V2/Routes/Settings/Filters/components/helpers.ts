// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientSettingsFilterSchema } from '../../apiResponseTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../istore.js' or its corres... Remove this comment to see the full error message
import { ClientTemplateSchema } from '../../istore.js';

type Filter = ClientSettingsFilterSchema & {
  rowId: string;
  subRows?: {
    rowId: string;
    _id?: string;
    id?: string;
    name?: string;
  }[];
};

type LoaderData = {
  filters: Filter[] | undefined;
  templates: ClientTemplateSchema[];
};

const filterAvailableTemplates = (templates: ClientTemplateSchema[], filters?: Filter[]) => {
  const usedTemplatesIds: string[] = [];

  filters?.forEach(filter => {
    if (filter.subRows) {
      // @ts-expect-error TS(7006): Parameter 'item' implicitly has an 'any' type.
      filter.subRows.forEach(item => {
        usedTemplatesIds.push(item.id!);
      });
    }

    if (filter.id) {
      usedTemplatesIds.push(filter.id);
    }
  });

  return templates.filter(template => !usedTemplatesIds.includes(template._id));
};

const createNewFilters = (
  selectedTemplatesIds: string[],
  templates?: ClientTemplateSchema[]
): Filter[] => {
  const newFilters = selectedTemplatesIds.map(templateId => {
    const template = templates?.find(templ => templ._id === templateId);
    return { id: templateId, name: template?.name, rowId: templateId };
  });

  return newFilters;
};

const updateFilters = (newFilter: Filter, filters?: Filter[]) => {
  let isNewFilter = true;

  const updatedFilters = filters?.map(filter => {
    if (filter.id === newFilter.id) {
      isNewFilter = false;
      return newFilter;
    }
    return filter;
  });

  if (isNewFilter) {
    return [...(updatedFilters || []), newFilter];
  }

  return updatedFilters;
};

const deleteFilters = (originalFilters?: Filter[], filtersToRemove?: (string | undefined)[]) => {
  if (!filtersToRemove) {
    return originalFilters;
  }

  const updatedFilters: Filter[] = [];

  originalFilters?.forEach(filter => {
    const updatedFilter = { ...filter };
    if (!filtersToRemove.includes(filter.rowId)) {
      if (filter.subRows) {
        // @ts-expect-error TS(7006): Parameter 'item' implicitly has an 'any' type.
        const subRows = filter.subRows.filter(item => !filtersToRemove.includes(item.rowId));
        updatedFilter.subRows = subRows;
      }
      updatedFilters.push(updatedFilter);
    }
  });

  return updatedFilters;
};

const sanitizeFilters = (filters?: Filter[]) => {
  const sanitizedFilters: ClientSettingsFilterSchema[] = [];

  filters?.forEach(filter => {
    // @ts-expect-error TS(2525): Initializer provides no value for this binding ele... Remove this comment to see the full error message
    const { rowId, subRows, ...sanitizedFilter } = { ...filter };

    if (subRows && subRows.length === 0) {
      return;
    }

    if (subRows) {
      sanitizedFilter.items = subRows.map(
        // @ts-expect-error TS(7031): Binding element 'itemRowId' implicitly has an 'any... Remove this comment to see the full error message
        ({ rowId: itemRowId, _id, ...sanitizedItem }) => sanitizedItem
      );
    }

    sanitizedFilters.push(sanitizedFilter);
  });

  return sanitizedFilters;
};

const formatFilters = (filters: ClientSettingsFilterSchema[]): Filter[] =>
  filters?.map(filter => {
    const tableFilter: Filter = {
      ...filter,
      rowId: filter._id!,
    };
    if (filter.items) {
      // @ts-expect-error TS(7006): Parameter 'item' implicitly has an 'any' type.
      const subRows = filter.items.map(item => ({ ...item, rowId: item.id! }));
      tableFilter.subRows = subRows;
    }
    return tableFilter;
  });

export type { LoaderData, Filter };
export {
  filterAvailableTemplates,
  createNewFilters,
  updateFilters,
  deleteFilters,
  sanitizeFilters,
  formatFilters,
};
