import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';

import { DocumentSidePanel } from '../../Documents.js';
import { actions as actionCreators } from '../../BasicReducer/index.js';
import { actions } from '../../Metadata.js';
import { deleteDocument, searchSnippets } from 'app/Library/actions/libraryActions.js';
import { deleteEntity } from '../../Entities/actions/actions.js';
import multiReducer from '../../Multireducer.js';
import modals from '../../Modals.js';

import EntityForm from 'app/Library/containers/EntityForm.js';

import { getDocumentReferences, saveDocument } from 'app/Library/actions/libraryActions.js';
import semanticSearchActions from '../actions';

export const mapStateToProps = ({ semanticSearch, library, templates }) => ({
  open: !semanticSearch.selectedDocument.isEmpty(),
  doc: semanticSearch.selectedDocument,
  references: library.sidepanel.references,
  tab: library.sidepanel.tab,
  docBeingEdited: !!Object.keys(library.sidepanel.metadata).length,
  searchTerm: library.search.searchTerm,
  formDirty: !library.sidepanel.metadataForm.$form.pristine,
  templates,
  formPath: 'library.sidepanel.metadata',
  readOnly: true,
  EntityForm,
  storeKey: 'library',
});

export function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      loadInReduxForm: actions.loadInReduxForm,
      getDocumentReferences,
      closePanel: semanticSearchActions.unselectSemanticSearchDocument,
      resetForm: () => _dispatch => {
        _dispatch(formActions.setInitial(`${props.storeKey}.sidepanel.metadata`));
        _dispatch(formActions.reset(`${props.storeKey}.sidepanel.metadata`));
      },
      saveDocument,
      deleteDocument,
      searchSnippets,
      deleteEntity,
      showModal: modals.actions.showModal,
      showTab: tab => actionCreators.set('library.sidepanel.tab', tab),
    },
    multiReducer.wrapDispatch(dispatch, props.storeKey)
  );
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentSidePanel);
