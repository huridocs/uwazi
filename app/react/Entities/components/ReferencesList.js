import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {fromJS as Immutable} from 'immutable';
import {searchReferences, loadMoreReferences} from 'app/Entities/actions/actions';
import {createSelector} from 'reselect';

import DocumentsList from 'app/Layout/DocumentsList';

const selectDocuments = createSelector(e => e.searchResults, d => d.toJS());

export function mapStateToProps({entityView}) {
  const documents = selectDocuments(entityView);

  return {
    documents,
    connections: {totalRows: documents.rows.reduce((total, r) => total + r.connections.length, 0)},
    filters: Immutable({documentTypes: []}),
    search: entityView.sort,
    sortButtonsStateProperty: 'entityView.sort'
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  return bindActionCreators({
    loadMoreDocuments: loadMoreReferences,
    searchDocuments: searchReferences.bind(null, ownProps.entity.sharedId)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
