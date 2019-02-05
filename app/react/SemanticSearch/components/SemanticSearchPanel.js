import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Field, LocalForm, actions } from 'react-redux-form';

import { t, I18NLink } from 'app/I18N';
import { Icon, ProgressBar } from 'UI';
import ShowIf from 'app/App/ShowIf';

import api from '../SemanticSearchAPI';

import SidePanel from 'app/Layout/SidePanel';

function SearchList({ searches }) {
  return (
    <div className="semantic-search-list">
      {searches.map(search => <SearchItem search={search} key={search._id} />)}
    </div>
  );
}

SearchList.defaultProps = {
  searches: []
};

SearchList.propTypes = {
  searches: PropTypes.array
};

function SearchItem({ search }) {
  const { status, documents } = search;
  const [completed, max] = documents.reduce(([completedAgg, maxAgg], doc) => [
    completedAgg + (doc.status === 'completed' ? 1 : 0),
    maxAgg + 1
  ], [0, 0]);
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
        { status === 'in_progress' &&
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
  search: PropTypes.object.isRequired
};

export class SemanticSearchSidePanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      page: 'main',
      searches: null
    };

    this.onSubmit = this.onSubmit.bind(this);
    this.submitForm = this.submitForm.bind(this);
    this.showMainPage = this.showMainPage.bind(this);
    this.showNewSearchPage = this.showNewSearchPage.bind(this);
  }

  componentDidMount() {
    if (!this.searches) {
      api.getAllSearches().then(res => this.setState({ searches: res }));
    }
  }

  onSubmit(model) {
    const { currentSearch, selectedDocuments } = this.props;
    const { searchTerm } = model;
    const documents = selectedDocuments ?
      selectedDocuments.toJS().map(doc => doc.sharedId) : [];
    api.search({
      searchTerm,
      documents,
      query: currentSearch
    });
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  showMainPage() {
    this.setState({ page: 'main' });
  }

  showNewSearchPage() {
    this.setState({ page: 'new' });
  }

  submitForm() {
    this.formDispatch(actions.submit('searchText'));
  }

  render() {
    const { page, searches } = this.state;
    return (
      <SidePanel open={this.props.open} className="metadata-sidepanel semantic-search">
        <ShowIf if={page === 'new'}>
          <div className="sidepanel-footer">
            <span
              className="btn btn-danger"
              onClick={this.showMainPage}
            >
              <Icon icon="times" />
              <span className="btn-label">{t('System', 'Cancel')}</span>
            </span>
            <button
              className="btn btn-success"
              onClick={this.submitForm}
            >
              <Icon icon="search" />
              <span className="btn-label">{t('System', 'Start search')}</span>
            </button>
          </div>
        </ShowIf>
        <div className="sidepanel-body">
          <p className="sidepanel-title">{t('System', 'Semantic search')}</p>
          <ShowIf if={page === 'main'}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 30,
              marginBottom: 30 }}
            >
              <button
                className="btn btn-default"
                onClick={this.showNewSearchPage}
              >
                {t('System', 'Start new search')}
              </button>
            </div>
          </ShowIf>
          <ShowIf if={page === 'main' && !!searches}>
            <SearchList searches={searches} />
          </ShowIf>
          <ShowIf if={page === 'new'}>
            <div>
              <LocalForm
                model="searchText"
                autoComplete="off"
                onSubmit={this.onSubmit}
                getDispatch={dispatch => this.attachDispatch(dispatch)}
              >
                <div className="search-box">
                  <div className="input-group">
                    <Field model=".searchTerm">
                      <Icon icon="search" />
                      <input
                        type="text"
                        placeholder={t('System', 'Search', null, false)}
                        className="form-control"
                        autoComplete="off"
                      />
                      <Icon icon="times"/>
                    </Field>
                  </div>
                </div>
              </LocalForm>
            </div>
          </ShowIf>
        </div>
      </SidePanel>
    );
  }
}

SemanticSearchSidePanel.propTypes = {
  currentSearch: PropTypes.object.isRequired,
  selectedDocuments: PropTypes.object.isRequired,
  open: PropTypes.bool.isRequired
};

export function mapStateToProps(state, props) {
  return {
    currentSearch: state[props.storeKey].search,
    selectedDocuments: state[props.storeKey].ui.get('selectedDocuments'),
    open: state[props.storeKey].ui.get('showSemanticSearchPanel')
  };
}

export default connect(mapStateToProps)(SemanticSearchSidePanel);
