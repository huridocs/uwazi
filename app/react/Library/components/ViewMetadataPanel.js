import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {unselectDocument, saveDocument} from '../actions/libraryActions';

import Immutable from 'immutable';
import {actions as formActions} from 'react-redux-form';
import modals from 'app/Modals';
import {formater} from 'app/Metadata';
import {actions} from 'app/Metadata';
import {deleteDocument} from 'app/Viewer/actions/documentActions';
import {deleteEntity} from 'app/Entities/actions/actions';
import {createSelector} from 'reselect';

import {DocumentSidePanel} from 'app/Documents';
import {actions as actionCreators} from 'app/BasicReducer';

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
    doc: {},
    tab: library.sidepanel.tab,
    open: library.ui.get('selectedDocument') ? true : false,
    docBeingEdited: !!library.sidepanel.metadata._id,
    formDirty: library.sidepanel.metadataForm.dirty,
    rawDoc: library.ui.get('selectedDocument') || Immutable.fromJS({}),
    templates: getTemplates(state),
    metadata: formatMetadata(state),
    formPath: 'library.sidepanel.metadata'
  };
};

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    loadInReduxForm: actions.loadInReduxForm,
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
