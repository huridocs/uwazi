import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {I18NLink} from 'app/I18N';
import {Field, Form, actions as formActions} from 'react-redux-form';
import {wrapDispatch} from 'app/Multireducer';

import {searchDocuments, setSearchTerm, getSuggestions, hideSuggestions, setOverSuggestions} from 'app/Library/actions/libraryActions';
import debounce from 'app/utils/debounce';
import {t} from 'app/I18N';

export class SearchBar extends Component {

  getSuggestions(e) {
    this.props.getSuggestions(e.target.value);
  }

  closeSuggestions() {
    this.props.setOverSuggestions(false);
    this.props.hideSuggestions();
  }

  mouseEnter() {
    this.props.setOverSuggestions(true);
  }

  mouseOut() {
    this.props.setOverSuggestions(false);
  }

  componentWillMount() {
    this.getSuggestions = debounce(this.getSuggestions, 400);
  }

  componentWillUnmount() {
    this.props.setOverSuggestions(false);
  }

  resetSearch() {
    this.props.change('search.searchTerm', '');
    let search = Object.assign({}, this.props.search);
    search.searchTerm = '';
    this.props.searchDocuments({search}, this.props.storeKey);
  }

  search(search) {
    this.props.searchDocuments({search}, this.props.storeKey);
  }

  render() {
    let {search, showSuggestions, suggestions, overSuggestions} = this.props;
    const model = this.props.storeKey + '.search';
    return (
      <div className={'search-box' + (this.props.open ? ' is-active' : '')}>
        <Form model={model} onSubmit={this.search.bind(this)} autoComplete="off">
          <div className={'input-group' + (search.searchTerm ? ' is-active' : '')}>
            <Field model={'.searchTerm'}>
              <i className="fa fa-search"></i>
              <input
                type="text"
                placeholder={t('System', 'Search')}
                className="form-control"
                onChange={this.getSuggestions.bind(this)}
                onBlur={this.props.hideSuggestions}
                autoComplete="off"
              />
              <i className="fa fa-close" onClick={this.resetSearch.bind(this)}></i>
            </Field>
          </div>
          <div
            onMouseOver={this.mouseEnter.bind(this)}
            onMouseLeave={this.mouseOut.bind(this)}
            className={'search-suggestions' + (showSuggestions && search.searchTerm || overSuggestions ? ' is-active' : '')}
            >
            {suggestions.toJS().map((suggestion, index) => {
              let documentViewUrl = `/${suggestion.type}/${suggestion.sharedId}`;
              return <p className="search-suggestions-item" key={index}>
                <I18NLink to={documentViewUrl}>
                  <span dangerouslySetInnerHTML={{__html: suggestion.title}}/>
                  <i className="fa fa-file-text-o">
                  </i>
                </I18NLink>
              </p>;
            })}
            <button className="search-suggestions-all"
                    type="submit" onClick={this.closeSuggestions.bind(this)}>
              View all results for <b>{search.searchTerm}</b>
            </button>
          </div>
        </Form>
      </div>
    );
  }
}

SearchBar.propTypes = {
  searchDocuments: PropTypes.func.isRequired,
  open: PropTypes.bool,
  change: PropTypes.func.isRequired,
  getSuggestions: PropTypes.func.isRequired,
  hideSuggestions: PropTypes.func.isRequired,
  setOverSuggestions: PropTypes.func.isRequired,
  suggestions: PropTypes.object,
  showSuggestions: PropTypes.bool,
  search: PropTypes.object,
  overSuggestions: PropTypes.bool,
  storeKey: PropTypes.string
};

export function mapStateToProps(state, props) {
  return {
    search: state[props.storeKey].search,
    suggestions: state[props.storeKey].ui.get('suggestions'),
    showSuggestions: state[props.storeKey].ui.get('showSuggestions'),
    overSuggestions: state[props.storeKey].ui.get('overSuggestions'),
    open: state[props.storeKey].ui.get('filtersPanel') && !state.library.ui.get('selectedDocument')
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({
    searchDocuments,
    setSearchTerm,
    getSuggestions,
    hideSuggestions,
    setOverSuggestions,
    change: formActions.change
  }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
