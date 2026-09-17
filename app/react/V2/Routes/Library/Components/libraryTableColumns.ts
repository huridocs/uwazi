import type { Template } from '#app/apiResponseTypes.js';
import type { PropertySchema, PropertyTypeSchema } from '#shared/types/commonTypes.js';

type LibraryTableDensity = 'comfortable' | 'compact';

type LibraryTableDisplayState = {
  density: LibraryTableDensity;
  hidden: string[];
  extraVisible: string[];
};

type LibraryTableColumnDef = {
  id: string;
  matchKey?: string;
  label: string;
  translationContext?: string;
  type: 'builtin' | PropertyTypeSchema;
  sortKey?: string;
  align?: 'left' | 'right';
  width?: string;
};

type LibraryTableColumnGroup = {
  id: string;
  templateId?: string;
  columns: LibraryTableColumnDef[];
};

type MatchableProperty = Pick<PropertySchema, 'name' | 'type' | 'content'> & {
  inherit?: { property?: string };
};

const BUILTIN_COLUMN_IDS = ['title', 'template', 'creationDate', 'editDate'] as const;

const DEFAULT_VISIBLE_COLUMN_IDS = new Set<string>(BUILTIN_COLUMN_IDS);

const DEFAULT_LIBRARY_TABLE_DISPLAY: LibraryTableDisplayState = {
  density: 'compact',
  hidden: [],
  extraVisible: [],
};

const BUILTIN_COLUMNS: LibraryTableColumnDef[] = [
  {
    id: 'title',
    matchKey: 'title',
    label: 'Title',
    type: 'builtin',
    sortKey: 'title',
    width: 'minmax(16rem, 3fr)',
  },
  {
    id: 'template',
    matchKey: 'template',
    label: 'Template',
    type: 'builtin',
    width: 'minmax(8rem, 0.8fr)',
  },
  {
    id: 'creationDate',
    matchKey: 'creationDate',
    label: 'Creation date',
    type: 'builtin',
    sortKey: 'creationDate',
    width: 'minmax(9rem, 0.9fr)',
  },
  {
    id: 'editDate',
    matchKey: 'editDate',
    label: 'Edit date',
    type: 'builtin',
    sortKey: 'editDate',
    width: 'minmax(9rem, 0.9fr)',
  },
];

const propertyMatchKey = (property: MatchableProperty): string =>
  `${property.name}::${property.type}::${property.content ?? ''}::${property.inherit?.property ?? ''}`;

const columnMatchKey = (column: Pick<LibraryTableColumnDef, 'id' | 'matchKey'>): string =>
  column.matchKey ?? column.id;

const scopedTemplates = (templates: Template[], selectedTemplateIds: string[]): Template[] => {
  const selected = selectedTemplateIds.filter(Boolean);
  if (!selected.length) {
    return templates;
  }
  return templates.filter(template => selected.includes(template._id));
};

const SORTABLE_PROPERTY_TYPES = new Set(['text', 'date', 'numeric', 'select']);

const isSortablePropertyType = (type?: PropertyTypeSchema) =>
  Boolean(type && SORTABLE_PROPERTY_TYPES.has(type));

const isSortableProperty = (property: PropertySchema) =>
  Boolean(
    property.filter &&
    (isSortablePropertyType(property.type) || isSortablePropertyType(property.inherit?.type))
  );

const propertySortKey = (property: PropertySchema) =>
  `metadata.${property.name}${property.inherit ? '.inheritedValue' : ''}`;

const MULTI_VALUE_PROPERTY_TYPES: ReadonlySet<string> = new Set([
  'geolocation',
  'multiselect',
  'relationship',
  'newRelationship',
  'nested',
  'multidate',
  'multidaterange',
]);

const propertyColumnWidth = (type?: PropertyTypeSchema): string =>
  type && MULTI_VALUE_PROPERTY_TYPES.has(type) ? 'minmax(12rem, 1.6fr)' : 'minmax(8rem, 1fr)';

const propertyToColumn = (property: PropertySchema, templateId: string): LibraryTableColumnDef => ({
  id: property.name,
  matchKey: propertyMatchKey(property),
  label: property.label,
  translationContext: templateId,
  type: property.type,
  ...(isSortableProperty(property) ? { sortKey: propertySortKey(property) } : {}),
  width: propertyColumnWidth(property.type),
});

const libraryTableColumnGroups = (
  templates: Template[],
  selectedTemplateIds: string[]
): LibraryTableColumnGroup[] => {
  const scoped = scopedTemplates(templates, selectedTemplateIds);
  const groups: LibraryTableColumnGroup[] = [{ id: 'builtins', columns: [...BUILTIN_COLUMNS] }];

  scoped.forEach(template => {
    const columns = (template.properties || []).map(property =>
      propertyToColumn(property, template._id)
    );
    if (!columns.length) {
      return;
    }
    groups.push({
      id: `template:${template._id}`,
      templateId: template._id,
      columns,
    });
  });

  return groups;
};

const libraryTableColumns = (
  templates: Template[],
  selectedTemplateIds: string[]
): LibraryTableColumnDef[] => {
  const columns: LibraryTableColumnDef[] = [];
  libraryTableColumnGroups(templates, selectedTemplateIds).forEach(group => {
    group.columns.forEach(column => {
      if (!columns.some(existing => columnMatchKey(existing) === columnMatchKey(column))) {
        columns.push(column);
      }
    });
  });
  return columns;
};

const isColumnVisible = (id: string, state: LibraryTableDisplayState): boolean =>
  DEFAULT_VISIBLE_COLUMN_IDS.has(id) ? !state.hidden.includes(id) : state.extraVisible.includes(id);

const visibleLibraryTableColumns = (
  columns: LibraryTableColumnDef[],
  state: LibraryTableDisplayState
): LibraryTableColumnDef[] =>
  columns.filter(column => isColumnVisible(columnMatchKey(column), state));

const toggleColumnVisibility = (
  id: string,
  state: LibraryTableDisplayState
): LibraryTableDisplayState => {
  const visible = isColumnVisible(id, state);
  if (DEFAULT_VISIBLE_COLUMN_IDS.has(id)) {
    return {
      ...state,
      hidden: visible ? [...state.hidden, id] : state.hidden.filter(columnId => columnId !== id),
    };
  }
  return {
    ...state,
    extraVisible: visible
      ? state.extraVisible.filter(columnId => columnId !== id)
      : [...state.extraVisible, id],
  };
};

export type {
  LibraryTableColumnDef,
  LibraryTableColumnGroup,
  LibraryTableDensity,
  LibraryTableDisplayState,
};
export {
  BUILTIN_COLUMN_IDS,
  BUILTIN_COLUMNS,
  DEFAULT_LIBRARY_TABLE_DISPLAY,
  DEFAULT_VISIBLE_COLUMN_IDS,
  columnMatchKey,
  isColumnVisible,
  libraryTableColumnGroups,
  libraryTableColumns,
  propertyMatchKey,
  toggleColumnVisibility,
  visibleLibraryTableColumns,
};
