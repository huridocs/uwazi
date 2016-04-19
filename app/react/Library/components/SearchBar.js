import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import {Link} from 'react-router';

import {searchDocuments, setSearchTerm, getSuggestions} from 'app/Library/actions/libraryActions';
import debounce from 'app/utils/debounce';

export class SearchBar extends Component {

  getSuggestions() {
    this.props.getSuggestions(this.field.value);
  }

  handleChange() {
    this.getSuggestions();
    this.props.setSearchTerm(this.field.value);
  }

  componentWillMount() {
    this.getSuggestions = debounce(this.getSuggestions, 400);
  }

  resetSearch() {
    this.props.setSearchTerm('');
  }

  search(e) {
    e.preventDefault();
    this.props.searchDocuments(this.props.searchTerm);
  }

  render() {
    let {searchTerm, showSuggestions, suggestions} = this.props;

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
            />
          <div className={'search-suggestions' + (showSuggestions && searchTerm ? ' active' : '')}>
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
  searchTerm: PropTypes.string,
  suggestions: PropTypes.array,
  showSuggestions: PropTypes.bool
};

export function mapStateToProps(state) {
  return state.library.ui.toJS();
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments, setSearchTerm, getSuggestions}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
