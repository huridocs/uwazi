import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import socket from 'app/socket';
import { Icon, } from 'UI';
import ShowIf from 'app/App/ShowIf';

import { hideSemanticSearch } from 'app/SemanticSearch/actions/actions';
import SidePanel from 'app/Layout/SidePanel';
import { fetchSearches, submitNewSearch, registerForUpdates, updateSearch } from '../actions/actions';

import SearchList from './SearchList';

export class SemanticSearchSidePanel extends Component {
  constructor(props) {
    super(props);

    this.registeredForUpdates = false;
    this.onSearchUpdated = this.onSearchUpdated.bind(this);

    socket.on('semanticSearchUpdated', this.onSearchUpdated);
  }

  componentDidMount() {
    if (!this.registeredForUpdates) {
      this.props.registerForUpdates();
      this.registeredForUpdates = true;
    }
    this.props.fetchSearches();
  }

  componentWillUnmount() {
    socket.removeListener('semanticSearchUpdated', this.onSearchUpdated);
  }

  onSearchUpdated({ updatedSearch }) {
    this.props.updateSearch(updatedSearch);
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  close() {
    this.props.hideSemanticSearch();
  }

  render() {
    const searches = this.props.searches.toJS();
    const { open } = this.props;
    return (
      <SidePanel open={open} className="metadata-sidepanel semantic-search">
        <button className="closeSidepanel close-modal" onClick={this.props.hideSemanticSearch}>
          <Icon icon="times" />
        </button>
        <div className="sidepanel-body">
          <ShowIf if={!!searches}>
            <SearchList searches={searches} />
          </ShowIf>
        </div>
      </SidePanel>
    );
  }
}

SemanticSearchSidePanel.propTypes = {
  currentFilters: PropTypes.object.isRequired,
  currentTypes: PropTypes.object.isRequired,
  searches: PropTypes.object.isRequired,
  hideSemanticSearch: PropTypes.func.isRequired,
  fetchSearches: PropTypes.func.isRequired,
  registerForUpdates: PropTypes.func.isRequired,
  updateSearch: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export function mapStateToProps(state, props) {
  return {
    currentFilters: state[props.storeKey].search.filters,
    currentTypes: state[props.storeKey].filters.get('documentTypes'),
    searches: state.semanticSearch.searches,
    search: state.semanticSearch.search,
    open: state.semanticSearch.showSemanticSearchPanel
  };
}

export function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    fetchSearches,
    submitNewSearch,
    registerForUpdates,
    updateSearch,
    hideSemanticSearch
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SemanticSearchSidePanel);
