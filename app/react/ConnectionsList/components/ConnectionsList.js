import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {fromJS as Immutable} from 'immutable';
import {searchReferences, loadMoreReferences} from '../actions/actions';
import {createSelector} from 'reselect';

import DocumentsList from 'app/Layout/DocumentsList';

const selectDocuments = createSelector(c => c.searchResults, d => d.toJS());

export function mapStateToProps({connectionsList}) {
  const documents = selectDocuments(connectionsList);

  return {
    documents,
    connections: {totalRows: documents.rows.reduce((total, r) => total + r.connections.length, 0)},
    filters: Immutable({documentTypes: []}),
    search: connectionsList.sort,
    sortButtonsStateProperty: 'connectionsList.sort'
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadMoreDocuments: loadMoreReferences,
    searchDocuments: searchReferences
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
