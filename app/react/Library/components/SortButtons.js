import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {actions} from 'react-redux-form';
import {searchDocuments} from 'app/Library/actions/libraryActions';

export class SortButtons extends Component {
  sort(property) {
    let {search} = this.props;
    let order = search.order;

    if (search.order === 'desc' && search.sort === property) {
      order = 'asc';
    }

    if (search.order === 'asc' && search.sort === property) {
      order = 'desc';
    }

    let sort = {sort: property, order: order};

    let filters = Object.assign({}, this.props.search, sort);
    this.props.merge('search', sort);
    this.props.searchDocuments(filters);
  }

  render() {
    let {search} = this.props;

    let order = 'down';
    if (search.order === 'asc') {
      order = 'up';
    }

    let sortingTitle = search.sort === 'title.raw';
    let sortingRecent = search.sort === 'creationDate';

    return (
      <p className="col-sm-5">
        Sort by
        <span className={sortingTitle ? 'active' : ''} onClick={() => this.sort('title.raw')}>
          A-Z
          {sortingTitle ? <i className={'fa fa-caret-' + order}></i> : ''}
        </span>
        <span className={sortingRecent ? 'active' : ''} onClick={() => this.sort('creationDate')}>
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
  search: PropTypes.object
};

export function mapStateToProps(state) {
  return {
    search: state.search
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({merge: actions.merge, searchDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SortButtons);
