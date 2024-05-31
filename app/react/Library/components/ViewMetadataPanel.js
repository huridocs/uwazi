import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { actions as formActions } from 'react-redux-form';
import Immutable from 'immutable';

import { DocumentSidePanel } from 'app/Documents';
import { actions as actionCreators } from 'app/BasicReducer';
import { actions } from 'app/Metadata';
import { deleteDocument, searchSnippets } from 'app/Library/actions/libraryActions';
import { deleteEntity } from 'app/Entities/actions/actions';
import { wrapDispatch } from 'app/Multireducer';
import { entityDefaultDocument } from 'shared/entityDefaultDocument';
import modals from 'app/Modals';

import * as connectionsActions from 'app/ConnectionsList/actions/actions';
import {
  getDocumentReferences,
  unselectAllDocuments,
  saveDocument,
} from '../actions/libraryActions';
import EntityForm from '../containers/EntityForm';

const getTemplates = state => state.templates;

const mapStateToProps = (state, props) => {
  const library = state[props.storeKey];
  const doc = library.ui.get('selectedDocuments').first() || Immutable.fromJS({ documents: [] });
  const defaultLanguage = state.settings.collection.get('languages').find(l => l.get('default'));
  const file = entityDefaultDocument(
    doc.get('documents') ? doc.get('documents').toJS() : [{}],
    doc.get('language'),
    defaultLanguage
  );

  return {
    open: library.ui.get('selectedDocuments').size === 1,
    doc,
    file,
    references: library.sidepanel.references,
    tab: library.sidepanel.tab,
    docBeingEdited: !!Object.keys(library.sidepanel.metadata).length,
    searchTerm: library.search.searchTerm,
    formDirty: !library.sidepanel.metadataForm.$form.pristine,
    templates: getTemplates(state),
    formPath: `${props.storeKey}.sidepanel.metadata`,
    readOnly: true,
    EntityForm,
  };
};

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators(
    {
      loadInReduxForm: actions.loadInReduxForm,
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

export default connect(mapStateToProps, mapDispatchToProps)(DocumentSidePanel);
