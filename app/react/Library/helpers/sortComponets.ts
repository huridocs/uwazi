import { t } from 'app/I18N';
import { ClientTemplateSchema } from 'app/istore';
import { propertyTypes } from 'shared/propertyTypes';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';

type SortType = {
  label: string;
  name: string;
  value: string;
  type: string;
  context?: ObjectIdSchema;
};

type SearchOptions = {
  order?: 'asc' | 'desc';
  sort?: string;
  searchTerm?: string;
};

const getCurrentSortOption = (sortOptions: SortType[], sortOption?: string) => {
  if (!sortOption || sortOption === 'creationDate') {
    const currentOption = sortOptions.find(option => option.value === 'creationDate');
    return currentOption?.label;
  }
  const currentOption = sortOptions.find(option => option.value === sortOption);
  return currentOption?.label;
};

const getPropertySortType = (selected: SortType): string =>
  selected.type === 'text' || selected.type === 'select' ? 'string' : 'number';

const isSortableType = (type: PropertySchema['type']) => {
  switch (type) {
    case propertyTypes.text:
    case propertyTypes.date:
    case propertyTypes.numeric:
    case propertyTypes.select:
      return true;
    default:
      return false;
  }
};

const isSortable = (property: PropertySchema) =>
  property.filter &&
  (isSortableType(property.type) || (property.inherit && isSortableType(property.inherit.type!)));

const getSortString = (property: PropertySchema) =>
  `metadata.${property.name}${property.inherit ? '.inheritedValue' : ''}`;

const getMetadataSorts = (templates: IImmutable<ClientTemplateSchema[]>) =>
  templates.toJS().reduce((sorts: SortType[], template: ClientTemplateSchema) => {
    (template.properties || []).forEach((property: PropertySchema) => {
      if (isSortable(property) && !sorts.find(s => s.name === property.name)) {
        sorts.push({
          label: property.label,
          name: property.name,
          value: getSortString(property),
          type: property.type,
          context: template._id,
        });
      }
    });
    return sorts;
  }, []);

const getCommonSorts = (search: SearchOptions) => [
  ...[
    { label: 'Title', value: 'title', type: 'text', context: 'System' },
    { label: 'Date added', value: 'creationDate', type: 'number', context: 'System' },
    { label: 'Date modified', value: 'editDate', type: 'number', context: 'System' },
  ],
  ...(search.searchTerm
    ? [
        {
          label: 'Search relevance',
          value: '_score',
          type: 'number',
          context: 'System',
        },
      ]
    : []),
];

const filterTemplates = (
  templates: IImmutable<ClientTemplateSchema[]>,
  selectedTemplates: IImmutable<string[]>
) =>
  templates.filter(i => i !== undefined && selectedTemplates.includes(i.get('_id')))! as IImmutable<
    ClientTemplateSchema[]
  >;

const getSortOptions = (
  search: SearchOptions,
  templates: IImmutable<ClientTemplateSchema[]>
): SortType[] =>
  [...getCommonSorts(search), ...getMetadataSorts(templates)].map(option => ({
    ...option,
    label: t(option.context, option.label, undefined, false),
  }));

export type { SearchOptions, SortType };

export { getPropertySortType, getCurrentSortOption, filterTemplates, getSortOptions };
