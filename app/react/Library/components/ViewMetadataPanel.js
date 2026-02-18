import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import Immutable from 'immutable';

import { DocumentSidePanelWithRouter } from '#app/Documents/components/DocumentSidePanel.js';
import { actions as actionCreators } from '#app/BasicReducer/index.js';
import { actions } from '#app/Metadata/index.js';
import { selectSnippet } from '#app/Viewer/actions/uiActions.js';
import { deleteDocument, searchSnippets } from '#app/Library/actions/libraryActions.js';
import { deleteEntity } from '#app/Entities/actions/actions.js';
import { wrapDispatch } from '#app/Multireducer/index.js';
import { entityDefaultDocument } from '#shared/entityDefaultDocument.js';
import modals from '#app/Modals/index.js';

import * as connectionsActions from '#app/ConnectionsList/actions/actions.js';
import {
  getDocumentReferences,
  unselectAllDocuments,
  saveDocument,
} from '../actions/libraryActions.js';
import { EntityForm } from '../containers/EntityForm.js';

const getTemplates = state => state.templates;

const mapStateToProps = (state, props) => {
  const library =
    state[props.storeKey] ||
    Immutable.fromJS({ ui: { selectedDocuments: [] }, sidepanel: {}, search: {} });
  const doc = library.ui.get('selectedDocuments').first() || Immutable.fromJS({ documents: [] });
  const defaultLang = state.settings?.collection?.get('languages')?.find(l => l.get('default'));
  const defaultLanguage = defaultLang ? defaultLang.get('key') : '';
  const file = entityDefaultDocument(
    doc.get('documents') ? doc.get('documents').toJS() : [{}],
    doc.get('language'),
    defaultLang
  );
  const selectedDocument =
    library.ui.get('selectedDocuments').size === 1
      ? library.ui.get('selectedDocuments').get(0)
      : null;
  const storeState = state[props.storeKey] || {};
  const sidepanel = storeState.sidepanel || {};
  const metadataForm = sidepanel.metadataForm || { $form: { pristine: true } };

  return {
    open: library.ui.get('selectedDocuments').size === 1,
    doc,
    file,
    references: library.sidepanel?.references,
    tab: library.sidepanel?.tab,
    docBeingEdited: !!Object.keys(sidepanel.metadata || {}).length,
    searchTerm: library.search?.searchTerm,
    formDirty: !metadataForm.$form?.pristine,
    templates: getTemplates(state) || Immutable.List(),
    formPath: `${props.storeKey}.sidepanel.metadata`,
    formData: sidepanel.metadata,
    formState: metadataForm,
    readOnly: true,
    EntityForm,
    connectionsGroups: state.relationships?.list?.connectionsGroups || Immutable.List(),
    excludeConnectionsTab: Boolean(state.relationships?.list?.connectionsGroups?.length),
    currentSidepanelView: state.library?.sidepanel?.view ?? 'entity',
    selectedDocument,
    defaultLanguage,
    newRelationshipsEnabled: !!state.settings?.collection?.get('features')?.get('newRelationships'),
    snippets:
      (storeState.sidepanel && typeof storeState.sidepanel.get === 'function'
        ? storeState.sidepanel.get('snippets')
        : storeState.sidepanel?.snippets) ||
      Immutable.fromJS({ count: 0, metadata: [], fullText: [] }),
    searchParams: storeState.search || {},
    selectedSnippet: state.documentViewer?.uiState?.get?.('snippet') || Immutable.Map(),
  };
};

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      loadInReduxForm: actions.loadInReduxForm,
      clearMetadataSelections: actions.clearMetadataSelections,
      selectSnippet,
      getDocumentReferences,
      connectionsChanged: connectionsActions.connectionsChanged,
      closePanel: unselectAllDocuments,
      resetForm: () => _dispatch => {
        _dispatch(formActions.setInitial(`${props.storeKey}.sidepanel.metadata`));
        _dispatch(formActions.reset(`${props.storeKey}.sidepanel.metadata`));
      },
      saveDocument,
      deleteDocument,
      searchSnippets,
      deleteEntity,
      showModal: modals.actions.showModal,
      showTab: tab => actionCreators.set(`${props.storeKey}.sidepanel.tab`, tab),
    },
    wrapDispatch(dispatch, props.storeKey)
  );
}

const ViewMetadataPanelConnected = connect(
  mapStateToProps,
  mapDispatchToProps
)(DocumentSidePanelWithRouter);
export { ViewMetadataPanelConnected as ViewMetadataPanel };
