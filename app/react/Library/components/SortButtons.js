import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { wrapDispatch } from 'app/Multireducer';
import { actions } from 'react-redux-form';
import { t } from 'app/I18N';
import { Icon } from 'UI';

class SortButtons extends Component {
  constructor(props) {
    super(props);
    this.state = { active: false, order: props.search.order };
    this.toggle = this.toggle.bind(this);
    this.changeOrder = this.changeOrder.bind(this);
  }

  getAdditionalSorts(templates, search) {
    const additionalSorts = templates.toJS().reduce((sorts, template) => {
      template.properties.forEach(property => {
        const sortable =
          property.filter &&
          (property.type === 'text' ||
            property.type === 'date' ||
            property.type === 'numeric' ||
            property.type === 'select');

        if (sortable && !sorts.find(s => s.property === property.name)) {
          const sortString = `metadata.${property.name}`;
          const sortOptions = { isActive: search.sort === sortString, search, type: property.type };

          sorts.push({
            property: property.name,
            html: this.createSortItem(
              sortString,
              sortString,
              template._id,
              property.label,
              sortOptions
            ),
          });
        }
      });
      return sorts;
    }, []);

    return additionalSorts.map(s => s.html);
  }

  createSortItem(key, sortString, context, label, options) {
    const { isActive, type } = options;
    const treatAs = type === 'text' || type === 'select' ? 'string' : 'number';

    return (
      <li key={key} className={`Dropdown-option ${isActive ? 'is-active' : ''}`}>
        <a
          className={`Dropdown-option__item ${isActive ? 'is-active' : ''}`}
          onClick={() => this.handleClick(sortString, treatAs)}
        >
          <span>{t(context, label)}</span>
        </a>
      </li>
    );
  }

  changeOrder() {
    const { sort } = this.props.search;
    this.sort(sort);
  }

  sort(property, defaultTreatAs) {
    const { search } = this.props;
    let treatAs = defaultTreatAs;

    if (search.sort === property) {
      treatAs = search.treatAs;
    }

    const sort = { sort: property, order: search.order === 'asc' ? 'desc' : 'asc', treatAs };

    this.props.merge(this.props.stateProperty, sort);

    // TEST!!!
    const filters = { ...this.props.search, ...sort, userSelectedSorting: true };
    // -------
    delete filters.treatAs;

    if (this.props.sortCallback) {
      this.props.sortCallback({ search: filters }, this.props.storeKey);
    }
  }

  handleClick(property, treatAs) {
    if (!this.state.active) {
      return;
    }

    this.sort(property, treatAs);
  }

  toggle() {
    this.setState(prevState => ({ active: !prevState.active }));
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

  renderDropdown(search, additionalSorts, { includeEvents = true } = {}) {
    const { active } = this.state;
    return (
      <div
        className={`Dropdown ${!includeEvents ? 'width-placeholder' : ''} order-by ${
          active && includeEvents ? 'is-active' : ''
        }`}
      >
        <ul className="Dropdown-list" onClick={includeEvents ? this.toggle : () => {}}>
          {this.createSortItem('title', 'title', 'System', 'Title', {
            isActive: search.sort === 'title',
            search,
            type: 'string',
          })}
          {this.createSortItem('creationDate', 'creationDate', 'System', 'Date added', {
            isActive: search.sort === 'creationDate',
            search,
            type: 'date',
          })}
          {this.createSortItem('editDate', 'editDate', 'System', 'Date modified', {
            isActive: search.sort === 'editDate',
            search,
            type: 'date',
          })}
          {search.searchTerm && (
            <li
              key="relevance"
              className={`Dropdown-option ${search.sort === '_score' ? 'is-active' : ''}`}
            >
              <a
                className={`Dropdown-option__item ${search.sort === '_score' ? 'is-active' : ''}`}
                onClick={() => (includeEvents ? this.handleClick('_score') : null)}
              >
                <span>{t('System', 'Search relevance')}</span>
              </a>
            </li>
          )}
          {additionalSorts}
        </ul>
      </div>
    );
  }

  render() {
    const { templates } = this.props;
    const search = this.validateSearch();
    const additionalSorts = this.getAdditionalSorts(templates, search);
    return (
      <div className="sort-buttons">
        {this.renderDropdown(search, additionalSorts, { includeEvents: false })}
        {this.renderDropdown(search, additionalSorts)}
        <button type="button" onClick={this.changeOrder}>
          <Icon icon={search.order === 'asc' ? 'arrow-circle-up' : 'arrow-circle-down'} />
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
