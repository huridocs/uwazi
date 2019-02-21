import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Field, LocalForm, actions } from 'react-redux-form';

import { t } from 'app/I18N';
import { Icon, } from 'UI';
import ShowIf from 'app/App/ShowIf';

import api from '../SemanticSearchAPI';

import SidePanel from 'app/Layout/SidePanel';
import SearchList from './SearchList';

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
              className="btn btn-danger cancel-search"
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
                className="btn btn-default new-search"
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
