import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {search} from '../actions/actions';

import SearchInput from 'app/Layout/SearchInput';
import debounce from 'app/utils/debounce';

export class SearchForm extends Component {
  search(searchTerm) {
    this.props.search(searchTerm);
  }

  componentWillMount() {
    this.search('');
    this.search = debounce(this.search, 400);
  }

  render() {
    return (
      <SearchInput onChange={(e) => this.search(e.target.value)}/>
    );
  }
}

SearchForm.propTypes = {
  search: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({search}, dispatch);
}

export default connect(null, mapDispatchToProps)(SearchForm);
