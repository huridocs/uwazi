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
          const defaultOrder = treatAs === 'number' ? 'desc' : 'asc';
          if (treatAs === 'string') {
            sorts.push({
              property: property.name,
              html: <li key={sorts.length + 1}
                        className={'Dropdown-option ' + (search.sort === sortString && search.order === 'asc' ? 'is-active' : '')}
                        onClick={() => this.handleClick(sortString, 'asc', treatAs)}>
                      {t(template._id, property.label)}: A-Z
                    </li>
            });
            sorts.push({
              property: property.name,
              html: <li key={sorts.length + 1}
                        className={'Dropdown-option ' + (search.sort === sortString && search.order === 'desc' ? 'is-active' : '')}
                        onClick={() => this.handleClick(sortString, 'desc', treatAs)}>
                      {t(template._id, property.label)}: Z-A
                    </li>
            });
          } else if (treatAs === 'number') {
            sorts.push({
              property: property.name,
              html: <li key={sorts.length + 1}
                        className={'Dropdown-option ' + (search.sort === sortString && search.order === 'desc' ? 'is-active' : '')}
                        onClick={() => this.handleClick(sortString, 'desc', treatAs)}>
                      {t(template._id, property.label)}: Recent
                    </li>
            });
            sorts.push({
              property: property.name,
              html: <li key={sorts.length + 1}
                        className={'Dropdown-option ' + (search.sort === sortString && search.order === 'asc' ? 'is-active' : '')}
                        onClick={() => this.handleClick(sortString, 'asc', treatAs)}>
                      {t(template._id, property.label)}: Last
                    </li>
            });
          }
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
    let {search, templates} = this.props;
    let order = search.order === 'asc' ? 'up' : 'down';
    let sortingTitle = search.sort === 'title';
    let sortingRecent = search.sort === 'creationDate';
    const additionalSorts = this.getAdditionalSorts(templates, search, order);
    return (
      <div className={'Dropdown order-by u-floatRight ' + (this.state.active ? 'is-active' : '')}>
        <ul className="Dropdown-list" onClick={this.toggle.bind(this)}>
          <li className={'Dropdown-option' + (sortingTitle && search.order === 'asc' ? ' is-active' : '')}
              onClick={() => this.handleClick('title', 'asc', 'string')}>
            Title: A-Z
          </li>
          <li className={'Dropdown-option' + (sortingTitle && search.order === 'desc' ? ' is-active' : '')}
              onClick={() => this.handleClick('title', 'desc', 'string')}>
            Title: Z-A
          </li>
          <li className={'Dropdown-option' + (sortingRecent && search.order === 'desc' ? ' is-active' : '')}
              onClick={() => this.handleClick('creationDate', 'desc', 'number')}>
            Date added: Recent
          </li>
          <li className={'Dropdown-option' + (sortingRecent && search.order === 'asc' ? ' is-active' : '')}
              onClick={() => this.handleClick('creationDate', 'asc', 'number')}>
            Date added: Last
          </li>
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
  const {templates} = state;
  const stateProperty = ownProps.stateProperty ? ownProps.stateProperty : 'search';
  const search = stateProperty.split('.').reduce((memo, property) => {
    return Object.keys(memo).indexOf(property) !== -1 ? memo[property] : null;
  }, state);
  return {stateProperty, search, templates};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({merge: actions.merge}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SortButtons);
