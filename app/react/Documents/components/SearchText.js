import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { t } from 'app/I18N';
import { actions as formActions, Field, LocalForm } from 'react-redux-form';
import { searchSnippets } from 'app/Library/actions/libraryActions';
import { highlightSearch } from 'app/Viewer/actions/uiActions';
import { browserHistory } from 'react-router';
import { scrollToPage } from 'app/Viewer/actions/uiActions';
import { toUrlParams } from '../../../shared/JSONRequest';
import { Icon } from 'UI';
import SnippetList from './SnippetList';

export class SearchText extends Component {
  resetSearch() {}

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  componentDidMount() {
    if (this.props.storeKey === 'documentViewer') {
      this.searchSnippets(this.props.searchTerm, this.props.doc.get('sharedId'));
    }
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.searchTerm !== this.props.searchTerm || nextProps.doc.get('sharedId') !== this.props.doc.get('sharedId')) {
      this.searchSnippets(nextProps.searchTerm, nextProps.doc.get('sharedId'));
    }
  }

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
    const query = browserHistory.getCurrentLocation().query;
    query.searchTerm = value.searchTerm;

    browserHistory.push(path + toUrlParams(query));

    return this.props.searchSnippets(value.searchTerm, this.props.doc.get('sharedId'), this.props.storeKey);
  }

  render() {
    const { doc, snippets } = this.props;
    const documentViewUrl = doc.get('type') === 'document' ?
      `/document/${doc.get('sharedId')}` : `/entity/${doc.get('sharedId')}`;
    return (
      <div>
        <LocalForm
          model="searchText"
          onSubmit={this.submit.bind(this)}
          getDispatch={dispatch => this.attachDispatch(dispatch)}
          autoComplete="off"
        >
          {this.props.storeKey === 'documentViewer' &&
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
                  <Icon icon="times" onClick={this.resetSearch.bind(this)}/>
                </Field>
              </div>
            </div>
          }
        </LocalForm>

        {!snippets.get('count') &&
          <div className="blank-state">
            <Icon icon="search" />
            <h4>{t('System', !this.props.searchTerm ? 'Search text' : 'No text match')}</h4>
            <p>{t('System', !this.props.searchTerm ? 'Search text description' : 'No text match description')}</p>
          </div>
        }
        {doc.size ?
          (<SnippetList
            doc={this.props.doc}
            snippets={snippets}
            scrollToPage={this.props.scrollToPage}
            searchTerm={this.props.searchTerm}
            documentViewUrl={documentViewUrl}
          />) : ''
        }
      </div>
    );
  }
}

SearchText.propTypes = {
  snippets: PropTypes.shape({
    toJS: PropTypes.func
  }),
  storeKey: PropTypes.string,
  searchTerm: PropTypes.string,
  doc: PropTypes.object,
  searchSnippets: PropTypes.func,
  scrollToPage: PropTypes.func,
  highlightSearch: PropTypes.func
};

SearchText.defaultProps = {
  searchTerm: '',
  scrollToPage,
  snippets: {
    count: 0,
    metadata: [],
    fullText: []
  }
};

function mapStateToProps(state, props) {
  return {
    snippets: state[props.storeKey].sidepanel.snippets,
    highlightSearch
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ searchSnippets }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchText);
