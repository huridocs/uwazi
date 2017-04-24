import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {wrapDispatch} from 'app/Multireducer';
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

export function mapStateToProps(state, props) {
  return {
    documents: state[props.storeKey].documents,
    filters: state[props.storeKey].filters,
    filtersPanel: state[props.storeKey].ui.get('filtersPanel'),
    search: state[props.storeKey].search,
    authorized: !!state.user.get('_id'),
    selectedDocuments: state[props.storeKey].ui.get('selectedDocuments'),
    multipleSelected: state[props.storeKey].ui.get('selectedDocuments').size > 1,
    clickOnDocument
  };
}

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({loadMoreDocuments, searchDocuments, selectDocument, selectDocuments, unselectDocument, unselectAllDocuments},wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentsList);
