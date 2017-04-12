import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {searchDocuments} from 'app/Library/actions/libraryActions';

import DocumentsList from 'app/Layout/DocumentsList';
import {loadMoreDocuments, selectDocument, unselectDocument, unselectAllDocuments, selectDocuments} from 'app/Library/actions/libraryActions';

export function clickOnDocument(e, doc, active) {
  const canSelectMultiple = this.props.authorized;
  const specialkeyPressed = e.metaKey || e.ctrlKey || e.shiftKey;

  if (!specialkeyPressed || !canSelectMultiple) {
    this.props.unselectAllDocuments();
  }

  if (active && !specialkeyPressed || !canSelectMultiple) {
    return this.props.selectDocument(doc);
  }

  if (active) {
    return this.props.unselectDocument(doc.get('_id'));
  }

  if (!active & e.shiftKey & canSelectMultiple) {
    const lastSelectedDocument = this.props.selectedDocuments.last();
    const docs = this.props.documents.get('rows');
    const startIndex = docs.reduce((result, _doc, index) => {
      if (_doc.get('_id') === lastSelectedDocument.get('_id')) {
        return index;
      }
      return result;
    }, -1);

    const endIndex = docs.reduce((result, _doc, index) => {
      if (_doc.get('_id') === doc.get('_id')) {
        return index;
      }
      return result;
    }, -1);

    let docsToSelect = docs.slice(startIndex, endIndex + 1);
    if (endIndex < startIndex) {
      docsToSelect = docs.slice(endIndex, startIndex + 1);
    }
    return this.props.selectDocuments(docsToSelect.toJS());
  }

  this.props.selectDocument(doc);
}

export function mapStateToProps(state) {
  return {
    documents: state.library.documents,
    filters: state.library.filters,
    filtersPanel: state.library.ui.get('filtersPanel'),
    search: state.search,
    authorized: !!state.user.get('_id'),
    selectedDocuments: state.library.ui.get('selectedDocuments'),
    multipleSelected: state.library.ui.get('selectedDocuments').size > 1,
    clickOnDocument
  };
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({loadMoreDocuments, searchDocuments, selectDocument, selectDocuments, unselectDocument, unselectAllDocuments}, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
