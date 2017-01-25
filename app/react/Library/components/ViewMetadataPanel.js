import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {getDocumentReferences, unselectDocument, saveDocument} from '../actions/libraryActions';

import Immutable from 'immutable';
import {actions as formActions} from 'react-redux-form';
import modals from 'app/Modals';
import {formater} from 'app/Metadata';
import {actions} from 'app/Metadata';
import {deleteDocument} from 'app/Viewer/actions/documentActions';
import {deleteEntity} from 'app/Entities/actions/actions';
import {createSelector} from 'reselect';
import DocumentForm from '../containers/DocumentForm';
import EntityForm from '../containers/EntityForm';

import {actions as actionCreators} from 'app/BasicReducer';
import {DocumentSidePanel} from 'app/Documents';

const selectedDocument = state => state.library.ui.get('selectedDocument') || Immutable.fromJS({});
const getTemplates = state => state.templates;
const selectThesauris = state => state.thesauris;
const formatMetadata = createSelector(
  selectedDocument,
  getTemplates,
  selectThesauris,
  (doc, templates, thesauris) => {
    return formater.prepareMetadata(doc ? doc.toJS() : {}, templates.toJS(), thesauris.toJS());
  }
);

const mapStateToProps = (state) => {
  const library = state.library;
  return {
    open: library.ui.get('selectedDocument') ? true : false,
    doc: library.ui.get('selectedDocument') || Immutable.fromJS({}),
    metadata: formatMetadata(state),
    references: library.sidepanel.references,
    tab: library.sidepanel.tab,
    docBeingEdited: !!library.sidepanel.metadata._id,
    formDirty: library.sidepanel.metadataForm.dirty,
    //rawDoc: library.ui.get('selectedDocument') || Immutable.fromJS({}),
    templates: getTemplates(state),
    formPath: 'library.sidepanel.metadata',
    readOnly: true,
    DocumentForm,
    EntityForm
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadInReduxForm: actions.loadInReduxForm,
    getDocumentReferences,
    unselectDocument,
    resetForm: formActions.reset,
    saveDocument,
    deleteDocument,
    deleteEntity,
    showModal: modals.actions.showModal,
    showTab: (tab) => actionCreators.set('library.tab', tab)
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentSidePanel);
