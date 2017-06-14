import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {t} from 'app/I18N';
import {actions as formActions, Field, LocalForm} from 'react-redux-form';
import {searchSnippets} from 'app/Library/actions/libraryActions';
import ShowIf from 'app/App/ShowIf';

export class SearchText extends Component {
  resetSearch() {}

  attachDispatch(dispatch) {
    this.formDispatch = dispatch;
  }

  componentWillReceiveProps(newProps) {
    if (newProps.doc.get('_id') && newProps.doc.get('_id') !== this.props.doc.get('_id') && this.props.searchSnippets) {
      this.props.searchSnippets(this.props.searchTerm, newProps.doc.get('sharedId'), this.props.storeKey);
      this.formDispatch(formActions.change('searchText.searchTerm', this.props.searchTerm));
    }
  }

  submit(value) {
    this.props.searchSnippets(value.searchTerm, this.props.doc.get('sharedId'), this.props.storeKey);
  }

  render() {
    let snippets = this.props.snippets.toJS();
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
                <div dangerouslySetInnerHTML={{__html: snippet + ' ...'}}></div>
                <span>
                  <a href="#">page 1</a>
                </span>
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
  searchSnippets: PropTypes.func
};

function mapStateToProps(state, props) {
  return {
    snippets: state[props.storeKey].sidepanel.snippets,
    searchTerm: props.storeKey !== 'documentViewer' ? state[props.storeKey].search.searchTerm : ''
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchSnippets}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchText);
