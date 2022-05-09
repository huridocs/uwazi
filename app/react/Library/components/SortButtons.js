import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { actions } from 'react-redux-form';
import { t } from 'app/I18N';
import { Icon } from 'UI';
import { DropdownList } from 'app/Forms';
import { propertyTypes } from 'shared/propertyTypes';

const isSortableType = type =>
  [propertyTypes.text, propertyTypes.date, propertyTypes.numeric, propertyTypes.select].includes(
    type
  );

const getMetadataSorts = templates =>
  templates.toJS().reduce((sorts, template) => {
    template.properties.forEach(property => {
      const sortable =
        property.filter &&
        (isSortableType(property.type) ||
          (property.inherit && isSortableType(property.inherit.type)));

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

class SortButtons extends Component {
  constructor(props) {
    super(props);
    this.changeOrder = this.changeOrder.bind(this);
  }

  changeOrder() {
    const { sort, treatAs } = this.props.search;
    this.sort(sort, treatAs, this.props.search.order === 'asc' ? 'desc' : 'asc');
  }

  sort(property, defaultTreatAs, selectedSort) {
    const treatAs = defaultTreatAs;
    let order = selectedSort;

    if (treatAs && !selectedSort) {
      order = treatAs === 'string' ? 'asc' : 'desc';
    }

    const sort = { sort: property, order, treatAs };

    this.props.merge(this.props.stateProperty, sort);

    // TEST!!!
    const filters = { ...this.props.search, ...sort, userSelectedSorting: true };
    // -------
    delete filters.treatAs;

    if (this.props.sortCallback) {
      this.props.sortCallback({ search: filters }, this.props.storeKey);
    }
  }

  validateSearch() {
    const { search } = this.props;
    const _search = { ...search };
    if (_search.sort === '_score' && !_search.searchTerm) {
      _search.sort = 'creationDate';
      _search.order = 'desc';
    }
    return _search;
  }

  render() {
    const { templates } = this.props;
    const search = this.validateSearch();
    const metadataSorts = getMetadataSorts(templates);
    const commonSorts = [
      { label: 'Title', value: 'title', type: 'text', context: 'System' },
      { label: 'Date added', value: 'creationDate', type: 'number', context: 'System' },
      { label: 'Date modified', value: 'editDate', type: 'number', context: 'System' },
    ];
    if (search.searchTerm) {
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
        <DropdownList
          className="sort-dropdown"
          value={search.sort}
          data={sortOptions}
          valueField="value"
          textField="label"
          onChange={selected =>
            this.sort(
              selected.value,
              selected.type === 'text' || selected.type === 'select' ? 'string' : 'number'
            )
          }
        />
        <button
          type="button"
          disabled={search.sort === '_score'}
          className={`sorting-toggle ${search.sort === '_score' && 'disabled'}`}
          onClick={this.changeOrder}
        >
          <Icon
            icon={search.order === 'asc' && search.sort !== '_score' ? 'arrow-up' : 'arrow-down'}
          />
        </button>
      </div>
    );
  }
}

SortButtons.propTypes = {
  searchDocuments: PropTypes.func,
  stateProperty: PropTypes.string,
  search: PropTypes.object,
  templates: PropTypes.object,
  merge: PropTypes.func,
  sortCallback: PropTypes.func,
  storeKey: PropTypes.string,
};

function mapStateToProps(state, ownProps) {
  let { templates } = state;
  const stateProperty = ownProps.stateProperty
    ? ownProps.stateProperty
    : `${ownProps.storeKey}.search`;

  if (ownProps.selectedTemplates && ownProps.selectedTemplates.count()) {
    templates = templates.filter(i => ownProps.selectedTemplates.includes(i.get('_id')));
  }

  const search = stateProperty
    .split(/[.,/]/)
    .reduce(
      (memo, property) => (Object.keys(memo).indexOf(property) !== -1 ? memo[property] : null),
      state
    );
  return { stateProperty, search, templates };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({ merge: actions.merge }, wrapDispatch(dispatch, props.storeKey));
}

export { SortButtons, mapStateToProps };
export default connect(mapStateToProps, mapDispatchToProps)(SortButtons);
