import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions} from 'react-redux-form';
import {t} from 'app/I18N';

export class SortButtons extends Component {

  constructor(props) {
    super(props);
    this.state = {active: false};
  }

  handleClick(property, defaultOrder, treatAs) {
    if (!this.state.active) {
      return;
    }

    this.sort(property, defaultOrder, treatAs);
  }

  sort(property, defaultOrder, defaultTreatAs) {
    let {search} = this.props;
    let order = defaultOrder || 'asc';
    let treatAs = defaultTreatAs;

    if (search.sort === property) {
      treatAs = search.treatAs;
    }

    let sort = {sort: property, order: order, treatAs};

    let filters = Object.assign({}, this.props.search, sort);
    this.props.merge(this.props.stateProperty, sort);
    delete filters.treatAs;

    if (this.props.sortCallback) {
      this.props.sortCallback(filters);
    }
  }

  createSortItem(key, sortString, context, label, options) {
    const {isActive, search, treatAs} = options;

    const firstOrder = treatAs !== 'number' ? 'asc' : 'desc';
    const secondOrder = treatAs !== 'number' ? 'desc' : 'asc';

    return (
      <li key={key}
          className={'Dropdown-option ' + (isActive ? 'is-active' : '')}>
        <a className={'Dropdown-option__item ' + (isActive && search.order === firstOrder ? 'is-active' : '')}
           onClick={() => this.handleClick(sortString, firstOrder, treatAs)}>
           {t(context, label)} ({treatAs !== 'number' ? 'A-Z' : t('System', 'Recently')})
        </a>
        <a className={'Dropdown-option__item ' + (isActive && search.order === secondOrder ? 'is-active' : '')}
           onClick={() => this.handleClick(sortString, secondOrder, treatAs)}>
           {t(context, label)} ({treatAs !== 'number' ? 'Z-A' : t('System', 'Least recently')})
        </a>
      </li>
    );
  }

  changeOrder() {
    const {sort, order} = this.props.search;
    this.sort(sort, order === 'desc' ? 'asc' : 'desc');
  }

  getAdditionalSorts(templates, search) {
    const additionalSorts = templates.toJS().reduce((sorts, template) => {
      template.properties.forEach(property => {
        if (property.sortable && !sorts.find(s => s.property === property.name)) {
          const sortString = 'metadata.' + property.name;
          const treatAs = property.type === 'date' ? 'number' : 'string';
          const sortOptions = {isActive: search.sort === sortString, search, treatAs};

          sorts.push({
            property: property.name,
            html: this.createSortItem(sorts.length + 2, sortString, template._id, property.label, sortOptions)
          });
        }
      });
      return sorts;
    }, []);

    return additionalSorts.map(s => s.html);
  }

  toggle() {
    this.setState({active: !this.state.active});
  }

  render() {
    const {search, templates} = this.props;
    const order = search.order === 'asc' ? 'up' : 'down';
    const additionalSorts = this.getAdditionalSorts(templates, search, order);
    return (
      <div className={'Dropdown order-by u-floatRight ' + (this.state.active ? 'is-active' : '')}>
        <ul className="Dropdown-list" onClick={this.toggle.bind(this)}>
          {this.createSortItem(0, 'title', 'System', 'Title', {isActive: search.sort === 'title', search, treatAs: 'string'})}
          {this.createSortItem(1, 'creationDate', 'System', 'Date added', {isActive: search.sort === 'creationDate', search, treatAs: 'number'})}
          {additionalSorts}
        </ul>
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
  sortCallback: PropTypes.func
};

export function mapStateToProps(state, ownProps) {
  let {templates} = state;
  const stateProperty = ownProps.stateProperty ? ownProps.stateProperty : 'search';

  if (ownProps.selectedTemplates && ownProps.selectedTemplates.count()) {
    templates = templates.filter(i => ownProps.selectedTemplates.includes(i.get('_id')));
  }

  const search = stateProperty.split('.').reduce((memo, property) => {
    return Object.keys(memo).indexOf(property) !== -1 ? memo[property] : null;
  }, state);

  return {stateProperty, search, templates};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({merge: actions.merge}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SortButtons);
