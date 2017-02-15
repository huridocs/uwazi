import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {searchDocuments} from 'app/Library/actions/libraryActions';
import {createSelector} from 'reselect';

import DocumentsList from 'app/Layout/DocumentsList';
import {loadMoreDocuments} from 'app/Library/actions/libraryActions';

const documentsSelector = createSelector(s => s.library.documents, d => d.toJS());

export function mapStateToProps(state) {
  return {
    documents: documentsSelector(state),
    filters: state.library.filters,
    filtersPanel: state.library.ui.get('filtersPanel'),
    search: state.search,
    authorized: !!state.user.get('_id'),
    selectedDocuments: state.library.ui.get('selectedDocuments'),
    multipleSelected: state.library.ui.get('selectedDocuments').size > 1
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadMoreDocuments, searchDocuments, selectDocument, selectDocuments, unselectDocument, unselectAllDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
