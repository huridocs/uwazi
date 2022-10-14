/* eslint-disable max-statements */
import React from 'react';
import { bindActionCreators, Dispatch } from 'redux';
import { connect, ConnectedProps } from 'react-redux';
import { actions } from 'react-redux-form';
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
const getMetadataSorts = (templates: IImmutable<ClientTemplateSchema[]>) =>
  templates.toJS().reduce((sorts: SortType[], template: ClientTemplateSchema) => {
    template.properties?.forEach((property: PropertySchema) => {
      const sortable =
        property.filter &&
        (isSortableType(property.type) ||
          (property.inherit && isSortableType(property.inherit.type!)));

      if (sortable && !sorts.find(s => s.name === property.name)) {
        const sortString = `metadata.${property.name}${property.inherit ? '.inheritedValue' : ''}`;
        sorts.push({
          label: property.label,
          name: property.name,
          value: sortString,
          type: property.type,
          context: template._id,
        });
      }
    });
    return sorts;
  }, []);

interface SortButtonsOwnProps {
  storeKey: 'library' | 'uploads';
  stateProperty: string;
  selectedTemplates: IImmutable<string[]>;
  sortCallback: Function;
}

const mapStateToProps = (state: IStore, ownProps: SortButtonsOwnProps) => {
  let { templates } = state;
  const stateProperty = ownProps.stateProperty
    ? ownProps.stateProperty
    : `${ownProps.storeKey}.search`;

  if (ownProps.selectedTemplates && ownProps.selectedTemplates.count()) {
    templates = templates.filter(
      i => i !== undefined && ownProps.selectedTemplates.includes(i.get('_id'))
    )!;
  }

  const search = stateProperty
    .split(/[.,/]/)
    .reduce(
      (memo: { [k: string]: any }, property: string) =>
        Object.keys(memo).indexOf(property) !== -1 ? memo[property] : null,
      state
    );
  return { stateProperty, search, templates };
};

const mapDispatchToProps = (dispatch: Dispatch<{}>, props: SortButtonsOwnProps) =>
  bindActionCreators({ merge: actions.merge }, wrapDispatch(dispatch, props.storeKey));

const connector = connect(mapStateToProps, mapDispatchToProps);

type mappedProps = ConnectedProps<typeof connector> & SortButtonsOwnProps;

const SortButtonsComponent = ({
  storeKey,
  search,
  merge,
  stateProperty,
  templates,
  sortCallback,
}: mappedProps) => {
  const sorting = (property: string, defaultTreatAs: string, selectedSort?: string) => {
    const treatAs = defaultTreatAs;
    let order = selectedSort;

    if (treatAs && !selectedSort) {
      order = treatAs === 'string' ? 'asc' : 'desc';
    }

    const newSort = { sort: property, order, treatAs };
    merge(stateProperty, newSort);

    // TEST!!!
    const filters = { ...search, ...newSort, userSelectedSorting: true };
    // -------
    delete filters.treatAs;

    if (sortCallback) {
      sortCallback({ search: filters }, storeKey);
    }
  };

  const changeOrder = () => {
    sorting(search.sort, search.treatAs, search.order === 'asc' ? 'desc' : 'asc');
  };

  const validateSearch = () => {
    const _search = { ...search };
    if (_search.sort === '_score' && !_search.searchTerm) {
      _search.sort = 'creationDate';
      _search.order = 'desc';
    }
    return _search;
  };

  const validatedSearch = validateSearch();
  const metadataSorts = getMetadataSorts(templates);
  const commonSorts = [
    { label: 'Title', value: 'title', type: 'text', context: 'System' },
    { label: 'Date added', value: 'creationDate', type: 'number', context: 'System' },
    { label: 'Date modified', value: 'editDate', type: 'number', context: 'System' },
  ];
  if (validatedSearch.searchTerm) {
    commonSorts.push({
      label: 'Search relevance',
      value: '_score',
      type: 'number',
      context: 'System',
    });
  }
  const sortOptions = [...commonSorts, ...metadataSorts].map(option => ({
    ...option,
    label: t(option.context, option.label, undefined, false),
  }));

  return (
    <div className="sort-buttons">
      {/*
        // @ts-ignore */}
      <DropdownList
        className="sort-dropdown"
        value={search.sort}
        data={sortOptions}
        valueField="value"
        textField="label"
        onChange={(selected: SortType) =>
          sorting(
            selected.value,
            selected.type === 'text' || selected.type === 'select' ? 'string' : 'number'
          )
        }
      />
      <button
        type="button"
        disabled={search.sort === '_score'}
        className={`sorting-toggle ${search.sort === '_score' && 'disabled'}`}
        onClick={changeOrder}
      >
        <Icon
          icon={search.order === 'asc' && search.sort !== '_score' ? 'arrow-up' : 'arrow-down'}
        />
      </button>
    </div>
  );
};

const container = connector(SortButtonsComponent);
export { container as SortButtons };
