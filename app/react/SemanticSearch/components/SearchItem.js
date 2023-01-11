import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18NLink } from 'app/I18N';
import SearchDescription from 'app/Library/components/SearchDescription';
import { withContext } from 'app/componentWrappers';
import { Icon, ProgressBar } from 'UI';

import { deleteSearch, resumeSearch, stopSearch } from '../actions/actions';

class SearchItemComponent extends Component {
  constructor(props) {
    super(props);
    this.delete = this.delete.bind(this);
    this.handleResumeClicked = this.handleResumeClicked.bind(this);
    this.handleStopClicked = this.handleStopClicked.bind(this);
  }

  handleStopClicked(e) {
    const { search, onStopClicked } = this.props;
    onStopClicked(search._id);
    e.preventDefault();
  }

  handleResumeClicked(e) {
    const { search, onResumeClicked } = this.props;
    onResumeClicked(search._id);
    e.preventDefault();
  }

  delete(e) {
    const { onDeleteClicked, search } = this.props;
    e.preventDefault();
    this.props.mainContext.confirm({
      accept: onDeleteClicked.bind(this, search._id),
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this search?',
    });
  }

  renderButtons() {
    const { search } = this.props;
    const { status } = search;
    return (
      <div className="buttons">
        <button type="button" className="btn btn-danger delete-search btn-xs" onClick={this.delete}>
          <Icon icon="trash-alt" size="sm" />
        </button>
        {['inProgress', 'pending'].includes(status) && (
          <button
            type="button"
            className="btn btn-warning stop-search btn-xs"
            onClick={this.handleStopClicked}
          >
            <Icon icon="stop" size="sm" />
          </button>
        )}
        {status === 'stopped' && (
          <button
            type="button"
            className="btn btn-success resume-search btn-xs"
            onClick={this.handleResumeClicked}
          >
            <Icon icon="play" size="sm" />
          </button>
        )}
      </div>
    );
  }

  render() {
    const { search } = this.props;
    const { status, documents } = search;
    const completed = documents.filter(doc => doc.status === 'completed').length;
    const max = documents.length;
    return (
      <I18NLink className="semantic-search-list-item" to={`semanticsearch/${search._id}`}>
        <div className="item-header">
          <div className="title">
            <SearchDescription searchTerm={search.searchTerm} query={search.query} />
          </div>
          {this.renderButtons()}
        </div>
        <div>{status !== 'completed' && <ProgressBar value={completed} max={max} />}</div>
      </I18NLink>
    );
  }
}

SearchItemComponent.propTypes = {
  search: PropTypes.shape({
    _id: PropTypes.string,
    searchTerm: PropTypes.string,
    documents: PropTypes.array,
    status: PropTypes.string,
    query: PropTypes.shape({ filters: PropTypes.object, types: PropTypes.array }),
  }).isRequired,
  onDeleteClicked: PropTypes.func.isRequired,
  onStopClicked: PropTypes.func.isRequired,
  onResumeClicked: PropTypes.func.isRequired,
  mainContext: PropTypes.shape({
    confirm: PropTypes.func,
  }).isRequired,
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      onDeleteClicked: deleteSearch,
      onStopClicked: stopSearch,
      onResumeClicked: resumeSearch,
    },
    dispatch
  );
}

const SearchItem = connect(null, mapDispatchToProps)(withContext(SearchItemComponent));
export { SearchItemComponent, mapDispatchToProps, SearchItem };
