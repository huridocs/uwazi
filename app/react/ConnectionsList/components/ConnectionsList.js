import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {fromJS as Immutable} from 'immutable';
import {searchReferences, loadMoreReferences} from '../actions/actions';

import DocumentsList from 'app/Layout/DocumentsList';
import SearchBar from 'app/ConnectionsList/components/SearchBar.js';

export function mapStateToProps({connectionsList}) {
  const documents = connectionsList.searchResults;

  return {
    documents,
    connections: {totalRows: documents.get('rows').reduce((total, r) => total + r.get('connections').size, 0)},
    filters: Immutable({documentTypes: []}),
    search: connectionsList.sort,
    sortButtonsStateProperty: 'connectionsList.sort',
    SearchBar
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadMoreDocuments: loadMoreReferences,
    searchDocuments: searchReferences
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
