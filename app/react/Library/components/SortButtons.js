import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions} from 'react-redux-form';
import {searchDocuments} from 'app/Library/actions/libraryActions';

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
    return templates.toJS().reduce((additionalSorts, template) => {
      template.properties.forEach(property => {
        if (property.sortable) {
          const sortString = 'metadata.' + property.name + '.raw';
          additionalSorts.push(
            <span key={additionalSorts.length + 1}
                  className={search.sort === sortString ? 'active' : ''}
                  onClick={this.sort.bind(this, sortString, property.type === 'date' ? 'desc' : 'asc')}>
              {property.label}
              {search.sort === sortString ? <i className={'fa fa-caret-' + order}></i> : ''}
            </span>
          );
        }
      });
      return additionalSorts;
    }, []);
  }

  render() {
    let {search, templates} = this.props;
    let order = search.order === 'asc' ? 'up' : 'down';
    let sortingTitle = search.sort === 'title.raw';
    let sortingRecent = search.sort === 'creationDate';
    const additionalSorts = this.getAdditionalSorts(templates, search, order);

    return (
      <p className="col-sm-5">
        Sort by
        {additionalSorts}
        <span className={sortingTitle ? 'active' : ''} onClick={() => this.sort('title.raw', 'asc')}>
          A-Z
          {sortingTitle ? <i className={'fa fa-caret-' + order}></i> : ''}
        </span>
        <span className={sortingRecent ? 'active' : ''} onClick={() => this.sort('creationDate', 'desc')}>
          Recent
          {sortingRecent ? <i className={'fa fa-caret-' + order}></i> : ''}
        </span>
      </p>
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
