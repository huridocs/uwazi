import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';
import {getValues} from 'redux-form';

import {searchDocuments, setSearchTerm, getSuggestions, hideSuggestions, setOverSuggestions} from 'app/Library/actions/libraryActions';
import debounce from 'app/utils/debounce';

export class SearchBar extends Component {

  getSuggestions() {
    this.props.getSuggestions(this.field.value);
  }

  handleChange() {
    this.getSuggestions();
    this.props.setSearchTerm(this.field.value);
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
    this.props.setSearchTerm('');
    this.mouseOut();
  }

  resetSearch() {
    this.props.setSearchTerm('');
    this.props.searchDocuments('', getValues(this.props.filtersForm));
  }

  search(e) {
    e.preventDefault();
    this.props.searchDocuments(this.props.searchTerm, getValues(this.props.filtersForm));
  }

  render() {
    let {searchTerm, showSuggestions, suggestions, overSuggestions} = this.props;

    return (
      <form onSubmit={this.search.bind(this)}>
        <div className={'input-group' + (searchTerm ? ' active' : '')}>
          <span className="input-group-btn" onClick={this.resetSearch.bind(this)}>
            <div className="btn btn-default"><i className="fa fa-search"></i><i className="fa fa-close"></i></div>
          </span>
            <input
              ref={(ref)=> this.field = ref}
              type="text"
              placeholder="Search"
              className="form-control"
              value={this.props.searchTerm}
              onChange={this.handleChange.bind(this)}
              onBlur={this.props.hideSuggestions}
            />
          <div
            onMouseOver={this.mouseEnter.bind(this)}
            onMouseLeave={this.mouseOut.bind(this)}
            className={'search-suggestions' + (showSuggestions && searchTerm || overSuggestions ? ' active' : '')}
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
            <p onClick={this.search.bind(this)} className="search-suggestions-all">
              <i className="fa fa-search"></i>See all documents for "{searchTerm}"
            </p>
          </div>
        </div>
      </form>
    );
  }
}

SearchBar.propTypes = {
  searchDocuments: PropTypes.func.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  getSuggestions: PropTypes.func.isRequired,
  hideSuggestions: PropTypes.func.isRequired,
  setOverSuggestions: PropTypes.func.isRequired,
  searchTerm: PropTypes.string,
  suggestions: PropTypes.array,
  filtersForm: PropTypes.object,
  showSuggestions: PropTypes.bool,
  overSuggestions: PropTypes.bool
};

export function mapStateToProps(state) {
  let props = state.library.ui.toJS();
  props.filtersForm = state.form.filters;
  return props;
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments, setSearchTerm, getSuggestions, hideSuggestions, setOverSuggestions}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
