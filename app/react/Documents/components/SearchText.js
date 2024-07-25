import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { withRouter } from 'app/componentWrappers';
import { t } from 'app/I18N';
import { actions as formActions, Field, LocalForm } from 'react-redux-form';
import { searchSnippets } from 'app/Library/actions/libraryActions';
import { selectSnippet } from 'app/Viewer/actions/uiActions';
import { Icon } from 'UI';
import ModalTips from 'app/App/ModalTips';
import { toUrlParams } from 'shared/JSONRequest';
import { SearchTipsContent } from 'app/App/SearchTipsContent';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import SnippetList from './SnippetList';

class SearchText extends Component {
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

  componentDidUpdate(prevProps) {
    if (
      prevProps.searchTerm !== this.props.searchTerm ||
      prevProps.doc.get('sharedId') !== this.props.doc.get('sharedId')
    ) {
      this.searchSnippets(this.props.searchTerm, this.props.doc.get('sharedId'));
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
    const path = this.props.location.pathname;

    const query = searchParamsFromSearchParams(this.props.searchParams);
    query.searchTerm = value.searchTerm;

    this.props.navigate(path + toUrlParams(query));

    return this.props.searchSnippets(
      value.searchTerm,
      this.props.doc.get('sharedId'),
      this.props.storeKey
    );
  }

  render() {
    const { doc, snippets } = this.props;
    const documentViewUrl = doc.get('file')
      ? `/document/${doc.get('sharedId')}/text-search`
      : `/entity/${doc.get('sharedId')}/text-search`;
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
                    placeholder={t('System', 'Search related entities or documents', null, false)}
                    className="form-control"
                    autoComplete="off"
                    aria-label={t('System', 'Search text description', null, false)}
                  />
                  <Icon icon="times" onClick={this.resetSearch} />
                </Field>
              </div>
              <ModalTips
                label={t('System', 'Search Tips', null, false)}
                title={t('System', 'Narrow down your searches', null, false)}
              >
                <SearchTipsContent />
              </ModalTips>
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
    get: PropTypes.func,
  }),
  storeKey: PropTypes.string,
  searchTerm: PropTypes.string,
  doc: PropTypes.object,
  searchSnippets: PropTypes.func,
  selectSnippet: PropTypes.func.isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    query: PropTypes.shape({ page: PropTypes.string, raw: PropTypes.string }),
    search: PropTypes.string,
  }).isRequired,
  searchParams: PropTypes.instanceOf(Object).isRequired,
  navigate: PropTypes.func,
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

export { SearchText };
export default connect(mapStateToProps, mapDispatchToProps)(withRouter(SearchText));
