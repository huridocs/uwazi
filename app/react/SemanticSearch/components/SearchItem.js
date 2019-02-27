import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { I18NLink } from 'app/I18N';
import { Icon, ProgressBar } from 'UI';

import { deleteSearch, resumeSearch, stopSearch } from '../actions/actions';

export class SearchItem extends Component {
  constructor(props) {
    super(props);
    this.delete = this.delete.bind(this);
  }

  delete(e) {
    e.preventDefault();
    this.context.confirm({
      accept: this.props.onDeleteClicked.bind(this, this.props.search._id),
      title: 'Confirm delete',
      message: 'Are you sure you want to delete this search?'
    });
  }


  render() {
    const { search, onStopClicked, onResumeClicked } = this.props;
    const { status, documents } = search;
    const completed = documents.filter(doc => doc.status === 'completed').length;
    const max = documents.length;
    return (
      <I18NLink className="semantic-search-list-item" to={`semanticsearch/${search._id}`}>
        <div className="item-header">
          {search.searchTerm}
          <button
            className="btn btn-danger delete-search"
            onClick={this.delete}
          >
            <Icon icon="trash-alt" />
          </button>
          { ['inProgress', 'pending'].includes(status) &&
            <button
              className="btn btn-warning stop-search"
              onClick={() => onStopClicked(search._id)}
            >
              <Icon icon="stop" />
            </button>
          }
          { status === 'stopped' &&
            <button
              className="btn btn-success resume-search"
              onClick={() => onResumeClicked(search._id)}
            >
              <Icon icon="play" />
            </button>
          }
        </div>
        <div>
          { status !== 'completed' &&
            <ProgressBar value={completed} max={max} />
          }
        </div>
      </I18NLink>
    );
  }
}

SearchItem.contextTypes = {
  confirm: PropTypes.func
};

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
