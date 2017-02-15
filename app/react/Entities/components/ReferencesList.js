// TEST!!!
import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {fromJS as Immutable} from 'immutable';
import {searchReferences, loadMoreReferences} from 'app/Entities/actions/actions';
import {createSelector} from 'reselect';

import DocumentsList from 'app/Layout/DocumentsList';

const selectDocuments = createSelector(s => s.entityView.searchResults, d => d.toJS());

export function mapStateToProps(state) {
  console.log('DOCUMENTS: ', selectDocuments(state));
  return {
    documents: selectDocuments(state),
    filters: Immutable({documentTypes: []}),
    // selectedDocument: state.library.ui.get('selectedDocument'),
    search: state.entityView.sort,
    sortButtonsStateProperty: 'entityView.sort'
  };
}

function mapDispatchToProps(dispatch, ownProps) {
  console.log('MDTP:', ownProps);
  return bindActionCreators({
    loadMoreDocuments: loadMoreReferences,
    searchDocuments: searchReferences.bind(null, ownProps.entity.sharedId)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
