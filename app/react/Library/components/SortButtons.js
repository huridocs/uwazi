import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {wrapDispatch} from 'app/Multireducer';
import {actions} from 'react-redux-form';
import ShowIf from 'app/App/ShowIf';
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

    this.props.merge(this.props.stateProperty, sort);

    // TEST!!!
    let filters = Object.assign({}, this.props.search, sort, {userSelectedSorting: true});
    // -------
    delete filters.treatAs;

    if (this.props.sortCallback) {
      this.props.sortCallback({search: filters}, this.props.storeKey);
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
           <span>{t(context, label)} ({treatAs !== 'number' ? 'A-Z' : t('System', 'Recently')})</span>
           <ShowIf if={isActive && search.order === firstOrder}>
             <i className="fa fa-caret-down"></i>
           </ShowIf>
           <ShowIf if={isActive && search.order === firstOrder}>
             <i className="fa fa-caret-up"></i>
           </ShowIf>
        </a>
        <a className={'Dropdown-option__item ' + (isActive && search.order === secondOrder ? 'is-active' : '')}
           onClick={() => this.handleClick(sortString, secondOrder, treatAs)}>
           <span>{t(context, label)} ({treatAs !== 'number' ? 'Z-A' : t('System', 'Least recently')})</span>
           <ShowIf if={isActive && search.order === secondOrder}>
             <i className="fa fa-caret-down"></i>
           </ShowIf>
           <ShowIf if={isActive && search.order === secondOrder}>
             <i className="fa fa-caret-up"></i>
           </ShowIf>
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
        const sortable = property.filter && (property.type === 'text' || property.type === 'date');

        if (sortable && !sorts.find(s => s.property === property.name)) {
          const sortString = 'metadata.' + property.name;
          const treatAs = property.type === 'date' ? 'number' : 'string';
          const sortOptions = {isActive: search.sort === sortString, search, treatAs};

          sorts.push({
            property: property.name,
            html: this.createSortItem(sorts.length + 3, sortString, template._id, property.label, sortOptions)
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
      <div className="sort-buttons">
        <div className={'Dropdown order-by ' + (this.state.active ? 'is-active' : '')}>
          <ul className="Dropdown-list" onClick={this.toggle.bind(this)}>
            {this.createSortItem(0, 'title', 'System', 'Title', {isActive: search.sort === 'title', search, treatAs: 'string'})}
            {this.createSortItem(1, 'creationDate', 'System', 'Date added', {isActive: search.sort === 'creationDate', search, treatAs: 'number'})}
            {this.createSortItem(2, 'search_score', 'System', 'Relevance', {isActive: search.sort === 'search_score', search, treatAs: 'string'})}
            {additionalSorts}
          </ul>
        </div>
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
  storeKey: PropTypes.string
};

export function mapStateToProps(state, ownProps) {
  let {templates} = state;
  const stateProperty = ownProps.stateProperty ? ownProps.stateProperty : ownProps.storeKey + '.search';

  if (ownProps.selectedTemplates && ownProps.selectedTemplates.count()) {
    templates = templates.filter(i => ownProps.selectedTemplates.includes(i.get('_id')));
  }

  const search = stateProperty.split('.').reduce((memo, property) => {
    return Object.keys(memo).indexOf(property) !== -1 ? memo[property] : null;
  }, state);

  return {stateProperty, search, templates};
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({merge: actions.merge}, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(SortButtons);
