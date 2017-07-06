import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {t, I18NLink} from 'app/I18N';
import {actions as formActions, Field, LocalForm} from 'react-redux-form';
import {searchSnippets} from 'app/Library/actions/libraryActions';
import {highlightSearch} from 'app/Viewer/actions/uiActions';
import ShowIf from 'app/App/ShowIf';
//import {Link} from 'react-router';
import {browserHistory} from 'react-router';
//import {isClient} from '../../utils';
import {scrollToPage} from 'app/Viewer/actions/uiActions';
import {toUrlParams} from '../../../shared/JSONRequest';

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
      this.formDispatch(formActions.change('searchText.searchTerm', searchTerm));
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
    let snippets = this.props.snippets.toJS();
    let documentViewUrl = `/document/${this.props.doc.get('sharedId')}`;

    return (
      <div>
        <LocalForm
          model={'searchText'}
          onSubmit={this.submit.bind(this)}
          getDispatch={(dispatch) => this.attachDispatch(dispatch)}
          autoComplete="off"
        >
          <ShowIf if={this.props.storeKey === 'documentViewer'} >
            <div className={'search-box'}>
              <div className={'input-group'}>
                <Field model={'.searchTerm'}>
                  <i className="fa fa-search"></i>
                  <input
                    type="text"
                    placeholder={t('System', 'Search')}
                    className="form-control"
                    autoComplete="off"
                  />
                  <i className="fa fa-close" onClick={this.resetSearch.bind(this)}></i>
                </Field>
              </div>
            </div>
          </ShowIf>
        </LocalForm>

        <ul className="snippet-list">
          {snippets.map((snippet, index) => {
            return (
              <li key={index}>
                <I18NLink
                  onClick={() => this.props.scrollToPage(snippet.page)}
                  to={`${documentViewUrl}?page=${snippet.page}&searchTerm=${this.props.searchTerm || ''}`}>
                  page {snippet.page}
                </I18NLink>
                <span dangerouslySetInnerHTML={{__html: snippet.text + ' ...'}}></span>
              </li>);
          })}
        </ul>
      </div>
    );
  }
}

SearchText.propTypes = {
  snippets: PropTypes.object,
  storeKey: PropTypes.string,
  searchTerm: PropTypes.string,
  doc: PropTypes.object,
  searchSnippets: PropTypes.func,
  scrollToPage: PropTypes.func,
  highlightSearch: PropTypes.func
};

SearchText.defaultProps = {
  scrollToPage
};

function mapStateToProps(state, props) {
  return {
    snippets: state[props.storeKey].sidepanel.snippets,
    highlightSearch
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchSnippets}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchText);
