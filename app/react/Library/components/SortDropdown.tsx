import React from 'react';
import { withRouter, WithRouterProps } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions } from 'react-redux-form';
import { omit } from 'lodash';
import { t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { Icon } from 'UI';
import { DropdownList } from 'app/Forms';
import { propertyTypes } from 'shared/propertyTypes';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { IImmutable } from 'shared/types/Immutable';
import { ClientTemplateSchema, IStore } from 'app/istore';

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

interface SortDropdownOwnProps {
  stateProperty: string;
  selectedTemplates: IImmutable<string[]>;
  sortCallback: Function;
}

const mapStateToProps = (state: IStore, ownProps: SortDropdownOwnProps) => {
  let templates;
  const stateProperty = ownProps.stateProperty ? ownProps.stateProperty : 'library.search';

  if (ownProps.selectedTemplates && ownProps.selectedTemplates.count()) {
    templates = state.templates.filter(
      i => i !== undefined && ownProps.selectedTemplates.includes(i.get('_id'))
    )! as IImmutable<ClientTemplateSchema[]>;
  }

  const search = stateProperty
    .split(/[.,/]/)
    .reduce(
      (memo: { [k: string]: any }, property: string) =>
        Object.keys(memo).indexOf(property) !== -1 ? memo[property] : null,
      state
    );
  return {
    stateProperty,
    search,
    templates: templates || state.templates,
    sortCallback: ownProps.sortCallback,
  };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ merge: actions.merge }, wrapDispatch(dispatch, 'library'));

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & WithRouterProps;

const getPropertySortType = (selected: SortType): string =>
  selected.type === 'text' || selected.type === 'select' ? 'string' : 'number';
const getToggleSearchIcon = (search: SearchOptions) =>
  search.order === 'asc' && search.sort !== '_score' ? 'arrow-up' : 'arrow-down';

const defaultSorts = [
  { label: 'Title', value: 'title', type: 'text', context: 'System' },
  { label: 'Date added', value: 'creationDate', type: 'number', context: 'System' },
  { label: 'Date modified', value: 'editDate', type: 'number', context: 'System' },
];

const getCommonSorts = (search: SearchOptions) => [
  ...defaultSorts,
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

const validateSearch = (search: SearchOptions): SearchOptions =>
  search.sort === '_score' && !search.searchTerm
    ? {
        sort: 'creationDate',
        order: 'desc',
        searchTerm: search.searchTerm,
      }
    : { searchTerm: search.searchTerm, sort: search.sort };

const sortDirection = (condition: string) => {
  switch (condition) {
    case 'desc':
    case 'string':
      return 'asc';
    case 'asc':
    default:
      return 'desc';
  }
};

const SortDropdownComponent = ({
  search,
  merge,
  stateProperty,
  templates,
  sortCallback,
  location,
}: mappedProps) => {
  const doSort = (property: string, defaultTreatAs: string, selectedSort?: string) => {
    const treatAs = defaultTreatAs;
    const order = selectedSort || sortDirection(treatAs);
    const newSort = { sort: property, order, treatAs };
    merge(stateProperty, newSort);
    const filters = { ...search, ...omit(newSort, 'treatAs'), userSelectedSorting: true };
    return sortCallback && sortCallback({ search: filters }, 'library');
  };

  const changeOrder = () => {
    doSort(search.sort, search.treatAs, sortDirection(search.order));
  };

  const metadataSorts = getMetadataSorts(templates);

  const validatedSearch = validateSearch(search);
  const commonSorts = getCommonSorts(validatedSearch);

  const sortOptions = [...commonSorts, ...metadataSorts].map(option => ({
    ...option,
    label: t(option.context, option.label, undefined, false),
  }));

  return (
    <div className="sort-buttons">
      <DropdownList
        className="sort-dropdown"
        value={validatedSearch.sort}
        data={sortOptions}
        valueField="value"
        textField="label"
        onChange={(selected: SortType) => doSort(selected.value, getPropertySortType(selected))}
      />
      <button
        type="button"
        disabled={search.sort === '_score'}
        className={`sorting-toggle ${search.sort === '_score' && 'disabled'}`}
        onClick={changeOrder}
      >
        <Icon icon={getToggleSearchIcon(search)} />
      </button>
    </div>
  );
};

const container = withRouter(connector(SortDropdownComponent));
export { container as SortDropdown };
