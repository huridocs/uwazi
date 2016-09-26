import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions} from 'react-redux-form';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {t} from 'app/I18N';

export class SortButtons extends Component {
  sort(property, defaultOrder) {
    let {search} = this.props;
    let order = defaultOrder;
    if (search.sort === property) {
      order = search.order === 'desc' ? 'asc' : 'desc';
    }

    let sort = {sort: property, order: order};

    let filters = Object.assign({}, this.props.search, sort);
    this.props.merge('search', sort);
    this.props.searchDocuments(filters);
  }

  getAdditionalSorts(templates, search, order) {
    const additionalSorts = templates.toJS().reduce((sorts, template) => {
      template.properties.forEach(property => {
        if (property.sortable && !sorts.find(s => s.property === property.name)) {
          const sortString = 'metadata.' + property.name;
          sorts.push({
            property: property.name,
            html:
              <li className="Dropdown-option" key={sorts.length + 1}>
                    className={search.sort === sortString ? 'active' : ''}
                    onClick={this.sort.bind(this, sortString, property.type === 'date' ? 'desc' : 'asc')}>
                {t(template.name, property.label)}
                {search.sort === sortString ? <i className={'fa fa-caret-' + order}></i> : ''}
              </li>
          });
        }
      });
      return sorts;
    }, []);

    return additionalSorts.map(s => s.html);
  }

  render() {
    let {search, templates} = this.props;
    let order = search.order === 'asc' ? 'up' : 'down';
    let sortingTitle = search.sort === 'title';
    let sortingRecent = search.sort === 'creationDate';
    const additionalSorts = this.getAdditionalSorts(templates, search, order);

    return (
      <div className="Dropdown u-floatRight">
        <span className="Dropdown-label">{t('System', 'Sort by')}</span>
        <ul className="Dropdown-list">
        <li className={'Dropdown-option' + (sortingTitle ? ' is-active' : '')} onClick={() => this.sort('title')}>
          A-Z
          {sortingTitle ? <i className={'fa fa-caret-' + order}></i> : ''}
        </li>
          {additionalSorts}
          <li className={'Dropdown-option' + (sortingRecent ? ' is-active' : '')} onClick={() => this.sort('creationDate')}>
            Recent
            {sortingRecent ? <i className={'fa fa-caret-' + order}></i> : ''}
          </li>
          {additionalSorts}
        </ul>
      </div>
    );
  }
}

SortButtons.propTypes = {
  searchDocuments: PropTypes.func,
  merge: PropTypes.func,
  search: PropTypes.object,
  templates: PropTypes.object
};

export function mapStateToProps({search, templates}) {
  return {search, templates};
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({merge: actions.merge, searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SortButtons);
