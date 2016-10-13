import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';

import SearchInput from 'app/Layout/SearchInput';
import {viewerSearchDocuments} from 'app/Viewer/actions/documentActions';

import debounce from 'app/utils/debounce';

export class ViewerSearchForm extends Component {
  search(searchTerm) {
    this.props.viewerSearchDocuments(searchTerm);
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

ViewerSearchForm.propTypes = {
  fields: PropTypes.object,
  values: PropTypes.object,
  viewerSearchDocuments: PropTypes.func
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({viewerSearchDocuments}, dispatch);
}

export default connect(null, mapDispatchToProps)(ViewerSearchForm);
