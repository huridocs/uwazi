import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {t} from 'app/I18N';
import {Field, LocalForm} from 'react-redux-form';
import {searchSnippets} from 'app/Library/actions/libraryActions';
import Immutable from 'immutable';

export class SearchText extends Component {
  resetSearch() {}

  submit(value) {
    this.props.searchSnippets(value.searchTerm, this.props.doc.get('sharedId'), this.props.storeKey);
  }

  render() {
    let snippets = this.props.snippets.toJS();
    if (!snippets.length) {
      snippets = this.props.doc.get('snippets') ? this.props.doc.get('snippets').toJS() : [];
    }

    return (
      <div>
        <div className={'search-box'}>
          <LocalForm model={'searchText'} onSubmit={this.submit.bind(this)} autoComplete="off">
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
          </LocalForm>
        </div>

        <ul>
          {snippets.map((snippet, index) => {
            return <li key={index} dangerouslySetInnerHTML={{__html: snippet}}></li>;
          })}
        </ul>
      </div>
    );
  }
}

SearchText.propTypes = {
  snippets: PropTypes.object,
  storeKey: PropTypes.string,
  doc: PropTypes.object,
  searchSnippets: PropTypes.func
};

function mapStateToProps(state, props) {
  return {
    snippets: state[props.storeKey].sidepanel.snippets
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchSnippets}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchText);
