import PropTypes from 'prop-types';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {search} from '../actions/actions';

import SearchInput from 'app/Layout/SearchInput';

export class SearchForm extends Component {
  render() {
    return (
      <SearchInput value={this.props.searchTerm}
                   onChange={(e) => this.props.search(e.target.value, this.props.connectionType)}/>
    );
  }
}

SearchForm.propTypes = {
  search: PropTypes.func,
  searchTerm: PropTypes.string,
  connectionType: PropTypes.string
};

function mapStateToProps({connections}) {
  return {
    searchTerm: connections.searchTerm
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({search}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(SearchForm);
