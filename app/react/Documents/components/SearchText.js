import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { t } from 'app/I18N';
import { actions as formActions, Field, LocalForm } from 'react-redux-form';
import { searchSnippets } from 'app/Library/actions/libraryActions';
import { selectSnippet } from 'app/Viewer/actions/uiActions';
import { browserHistory } from 'react-router';
import { Icon } from 'UI';
import SearchTips from 'app/Library/components/SearchTips';
import { toUrlParams } from '../../../shared/JSONRequest';
import SnippetList from './SnippetList';

export class SearchText extends Component {
  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
    this.resetSearch = this.resetSearch.bind(this);
  }

  componentDidMount() {
    if (this.props.storeKey === 'documentViewer') {
      this.searchSnippets(this.props.searchTerm, this.props.doc.get('sharedId'));
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.searchTerm !== this.props.searchTerm ||
      nextProps.doc.get('sharedId') !== this.props.doc.get('sharedId')
    ) {
      this.searchSnippets(nextProps.searchTerm, nextProps.doc.get('sharedId'));
    }
  }

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  resetSearch() {}

  searchSnippets(searchTerm, sharedId) {
    if (sharedId) {
      this.props.searchSnippets(searchTerm, sharedId, this.props.storeKey);
      if (this.formDispatch) {
        this.formDispatch(formActions.change('searchText.searchTerm', searchTerm));
      }
    }
  }

  submit(value) {
    const path = browserHistory.getCurrentLocation().pathname;
    const { query } = browserHistory.getCurrentLocation();
    query.searchTerm = value.searchTerm;

    browserHistory.push(path + toUrlParams(query));

    return this.props.searchSnippets(
      value.searchTerm,
      this.props.doc.get('sharedId'),
      this.props.storeKey
    );
  }

  render() {
    const { doc, snippets } = this.props;
    const documentViewUrl = doc.get('file')
      ? `/document/${doc.get('sharedId')}`
      : `/entity/${doc.get('sharedId')}`;
    return (
      <div>
        <LocalForm
          model="searchText"
          onSubmit={this.submit}
          getDispatch={dispatch => this.attachDispatch(dispatch)}
          autoComplete="off"
        >
          {this.props.storeKey === 'documentViewer' && (
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
                  <Icon icon="times" onClick={this.resetSearch} />
                </Field>
              </div>
              <SearchTips />
            </div>
          )}
        </LocalForm>

        {!snippets.get('count') && (
          <div className="blank-state">
            <Icon icon="search" />
            <h4>{t('System', !this.props.searchTerm ? 'Search text' : 'No text match')}</h4>
            <p>
              {t(
                'System',
                !this.props.searchTerm ? 'Search text description' : 'No text match description'
              )}
            </p>
          </div>
        )}
        {doc.size ? (
          <SnippetList
            doc={this.props.doc}
            snippets={snippets}
            selectSnippet={this.props.selectSnippet}
            searchTerm={this.props.searchTerm}
            documentViewUrl={documentViewUrl}
          />
        ) : (
          ''
        )}
      </div>
    );
  }
}

SearchText.propTypes = {
  snippets: PropTypes.shape({
    toJS: PropTypes.func,
  }),
  storeKey: PropTypes.string,
  searchTerm: PropTypes.string,
  doc: PropTypes.object,
  searchSnippets: PropTypes.func,
  selectSnippet: PropTypes.func.isRequired,
};

SearchText.defaultProps = {
  searchTerm: '',
  snippets: {
    count: 0,
    metadata: [],
    fullText: [],
  },
};

function mapStateToProps(state, props) {
  return {
    snippets: state[props.storeKey].sidepanel.snippets,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ searchSnippets, selectSnippet }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchText);
