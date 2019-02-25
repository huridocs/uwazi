import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18NLink } from 'app/I18N';
import { Icon, ProgressBar } from 'UI';

import { deleteSearch, resumeSearch, stopSearch } from '../actions/actions';

export function SearchItem({ search, onDeleteClicked, onStopClicked, onResumeClicked }) {
  const { status, documents } = search;
  const completed = documents.filter(doc => doc.status === 'completed').length;
  const max = documents.length;

  return (
    <div className="semantic-search-list-item">
      <div className="item-header">
        <I18NLink to={`semanticsearch/${search._id}`}>{search.searchTerm}</I18NLink>
        { status === 'in_progress' &&
          <Icon icon="spinner" spin />
        }
        {
          status === 'completed' &&
          <Icon className="text-primary" icon="check-circle" />
        }
      </div>
      <ProgressBar value={completed} max={max} />
      <div className="item-footer">
        <button
          className="btn btn-danger"
          onClick={() => onDeleteClicked(search._id)}
        >
          <Icon icon="trash-alt" />
        </button>
        { ['inProgress', 'pending'].includes(status) &&
          <button
            className="btn btn-warning"
            onClick={() => onStopClicked(search._id)}
          >
            <Icon icon="stop" />
          </button>
        }
        { status === 'stopped' &&
          <button
            className="btn btn-success"
            onClick={() => onResumeClicked(search._id)}
          >
            <Icon icon="play" />
          </button>
        }
        <button className="btn btn-success">
          <Icon icon="paper-plane" />
        </button>
      </div>
    </div>
  );
}

SearchItem.propTypes = {
  search: PropTypes.shape({
    _id: PropTypes.string,
    searchTerm: PropTypes.string,
    documents: PropTypes.array,
    status: PropTypes.string
  }).isRequired,
  onDeleteClicked: PropTypes.func.isRequired,
  onStopClicked: PropTypes.func.isRequired,
  onResumeClicked: PropTypes.func.isRequired
};

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onDeleteClicked: deleteSearch,
    onStopClicked: stopSearch,
    onResumeClicked: resumeSearch
  }, dispatch);
}

export default connect(null, mapDispatchToProps)(SearchItem);
