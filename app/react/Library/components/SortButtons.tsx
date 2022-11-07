import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions } from 'react-redux-form';
import { t } from 'app/I18N';
import { wrapDispatch } from 'app/Multireducer';
import { Icon } from 'UI';
import { DropdownList } from 'app/Forms';
import { IImmutable } from 'shared/types/Immutable';
import { ClientTemplateSchema, IStore } from 'app/istore';
import { omit } from 'lodash';
import {
  getCommonSorts,
  getMetadataSorts,
  getPropertySortType,
  SearchOptions,
  SortType,
} from '../helpers/sortComponets';

interface SortButtonsOwnProps {
  stateProperty: string;
  selectedTemplates: IImmutable<string[]>;
  sortCallback: Function;
}

const mapStateToProps = (state: IStore, ownProps: SortButtonsOwnProps) => {
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
  return { ...ownProps, stateProperty, search, templates: templates || state.templates };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>) =>
  bindActionCreators({ merge: actions.merge }, wrapDispatch(dispatch, 'library'));

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector>;

const getToggleSearchIcon = (search: SearchOptions) =>
  search.order === 'asc' && search.sort !== '_score' ? 'arrow-up' : 'arrow-down';

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

const SortButtonsComponent = ({
  search,
  merge,
  stateProperty,
  templates,
  sortCallback,
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

const container = connector(SortButtonsComponent);
export type { SortButtonsOwnProps };
export { container as SortButtons, mapStateToProps };
