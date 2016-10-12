import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import {search} from '../actions/actions';

import SearchInput from 'app/Layout/SearchInput';
import debounce from 'app/utils/debounce';

export class SearchForm extends Component {
  search(searchTerm, connectionType) {
    this.props.search(searchTerm, connectionType);
  }

  componentWillMount() {
    this.search('');
    this.search = debounce(this.search, 400);
  }

  render() {
    return (
      <SearchInput onChange={(e) => this.search(e.target.value, this.props.connectionType)}/>
    );
  }
}

SearchForm.propTypes = {
  search: PropTypes.func,
  connectionType: PropTypes.string
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({search}, dispatch);
}

export default connect(null, mapDispatchToProps)(SearchForm);
