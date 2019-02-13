import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { I18NLink } from 'app/I18N';
import { Icon, ProgressBar } from 'UI';

export function SearchItem({ search }) {
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
        <button className="btn btn-danger">
          <Icon icon="trash-alt" />
        </button>
        { status === 'inProgress' &&
          <button className="btn btn-warning">
            <Icon icon="stop" />
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
  }).isRequired
};

export default connect()(SearchItem);
