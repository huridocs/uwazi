import React, {Component, PropTypes} from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import {searchDocuments, setSearchTerm} from 'app/Library/actions/libraryActions';

export class SearchBar extends Component {

  handleChange() {
    this.props.setSearchTerm(this.field.value);
  }

  search(e) {
    e.preventDefault();
    this.props.searchDocuments(this.props.searchTerm);
  }

  render() {
    return (
      <form onSubmit={this.search.bind(this)}>
        <div className="input-group">
          <span className="input-group-btn">
            <button className="btn btn-default"><i className="fa fa-search"></i><i className="fa fa-close"></i></button></span>
            <input
              ref={(ref)=> this.field = ref}
              type="text"
              placeholder="Search"
              className="form-control"
              value={this.props.searchTerm}
              onChange={this.handleChange.bind(this)}
            />
          <div className="search-suggestions">
            <p> <b>Africa</b> Legal Aid (on behalf of Isaac and Robert Banda) Gambia (The)<i className="fa fa-arrow-left"></i></p>
            <p>149 96 <b>Africa</b> Sir Dawda K. Jawara Gambia (The)<i className="fa fa-arrow-left"></i></p>
            <p>Democratic Republic of Congo Burundi, Rwanda, Uganda, <b>Africa</b><i className="fa fa-arrow-left"></i></p>
            <p id="all-africa-documents" className="search-suggestions-all"><i className="fa fa-search"></i>See all documents for "africa"</p>
          </div>
        </div>
      </form>
    );
  }
}

SearchBar.propTypes = {
  searchDocuments: PropTypes.func.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  searchTerm: PropTypes.string
};

export function mapStateToProps(state) {
  return state.library.ui.toJS();
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({searchDocuments, setSearchTerm}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchBar);
