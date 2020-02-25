import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import SearchInput from 'app/Layout/SearchInput';

import { search } from '../actions/actions';

export class SearchEntitiesForm extends Component {
  constructor(props) {
    super(props);
    this.search = this.search.bind(this);
  }

  search(e) {
    this.props.search(e.target.value);
  }

  render() {
    return <SearchInput value={this.props.searchTerm} onChange={this.search} />;
  }
}

SearchEntitiesForm.propTypes = {
  search: PropTypes.func,
  searchTerm: PropTypes.string,
  connectionType: PropTypes.string,
};

function mapStateToProps({ relationships }) {
  return {
    searchTerm: relationships.searchTerm,
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({ search }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchEntitiesForm);
