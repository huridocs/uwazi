import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import {getValues} from 'redux-form';
import {Field, Form, actions as formActions} from 'react-redux-form';

import {searchDocuments, setSearchTerm, getSuggestions, hideSuggestions, setOverSuggestions} from 'app/Library/actions/libraryActions';
import debounce from 'app/utils/debounce';

export class SearchBar extends Component {

  getSuggestions(e) {
    this.props.getSuggestions(e.target.value);
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
    let filters = Object.assign({}, getValues(this.props.filtersForm), this.props.search);
    filters.searchTerm = '';
    this.props.searchDocuments(filters);
  }

  search(formValues) {
    let filters = Object.assign({}, formValues, getValues(this.props.filtersForm));
    this.props.searchDocuments(filters);
  }

  render() {
    let {search, showSuggestions, suggestions, overSuggestions} = this.props;

    return (
      <Form model="search" onSubmit={this.search.bind(this)}>
        <div className={'input-group' + (search.searchTerm ? ' active' : '')}>
          <span className="input-group-btn" onClick={this.resetSearch.bind(this)}>
            <div className="btn btn-default"><i className="fa fa-search"></i><i className="fa fa-close"></i></div>
          </span>
          <Field model="search.searchTerm">
            <input
              type="text"
              placeholder="Search"
              className="form-control"
              onChange={this.getSuggestions.bind(this)}
              onBlur={this.props.hideSuggestions}
            />
          </Field>
          <div
            onMouseOver={this.mouseEnter.bind(this)}
            onMouseLeave={this.mouseOut.bind(this)}
            className={'search-suggestions' + (showSuggestions && search.searchTerm || overSuggestions ? ' active' : '')}
            >
            {suggestions.map((suggestion, index) => {
              let documentViewUrl = '/document/' + suggestion._id;
              return <p key={index}>
                <Link to={documentViewUrl}>
                  <span dangerouslySetInnerHTML={{__html: suggestion.title}}/>
                  <i className="fa fa-arrow-left">
                  </i>
                </Link>
              </p>;
            })}
            <p className="search-suggestions-all">
            <button type="submit">
              <i className="fa fa-search"></i>See all documents for "{search.searchTerm}"
            </button>
            </p>
          </div>
        </div>
      </Form>
    );
  }
}

SearchBar.propTypes = {
  searchDocuments: PropTypes.func.isRequired,
  change: PropTypes.func.isRequired,
  getSuggestions: PropTypes.func.isRequired,
  hideSuggestions: PropTypes.func.isRequired,
  setOverSuggestions: PropTypes.func.isRequired,
  suggestions: PropTypes.array,
  filtersForm: PropTypes.object,
  showSuggestions: PropTypes.bool,
  search: PropTypes.object,
  overSuggestions: PropTypes.bool
};

export function mapStateToProps(state) {
  let props = state.library.ui.toJS();
  props.filtersForm = state.form.filters;
  props.search = state.search;
  return props;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments, setSearchTerm, getSuggestions, hideSuggestions, setOverSuggestions, change: formActions.change}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
