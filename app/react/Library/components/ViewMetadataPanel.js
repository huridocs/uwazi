import {connect} from 'react-redux';
import {bindActionCreators} from 'redux';
import {wrapDispatch} from 'app/Multireducer';
import {getDocumentReferences, unselectAllDocuments, saveDocument} from '../actions/libraryActions';

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

const selectedDocument = (state, props) => state[props.storeKey].ui.get('selectedDocuments').first() || Immutable.fromJS({});
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

const mapStateToProps = (state, props) => {
  const library = state[props.storeKey];
  return {
    open: library.ui.get('selectedDocuments').size === 1,
    doc: library.ui.get('selectedDocuments').first() || Immutable.fromJS({}),
    metadata: formatMetadata(state, props),
    references: library.sidepanel.references,
    tab: library.sidepanel.tab,
    docBeingEdited: !!Object.keys(library.sidepanel.metadata).length,
    formDirty: !library.sidepanel.metadataForm.$form.pristine,
    templates: getTemplates(state),
    formPath: props.storeKey + '.sidepanel.metadata',
    readOnly: true,
    DocumentForm,
    EntityForm
  };
};

function mapDispatchToProps(dispatch, props) {
  return bindActionCreators({
    loadInReduxForm: actions.loadInReduxForm,
    getDocumentReferences,
    closePanel: unselectAllDocuments,
    resetForm: () => {
      return (_dispatch) => {
        _dispatch(formActions.setInitial(props.storeKey + '.sidepanel.metadata'));
        _dispatch(formActions.reset(props.storeKey + '.sidepanel.metadata'));
      };
    },
    saveDocument,
    deleteDocument,
    deleteEntity,
    showModal: modals.actions.showModal,
    showTab: (tab) => actionCreators.set(props.storeKey + '.sidepanel.tab', tab)
  }, wrapDispatch(dispatch, props.storeKey));
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentSidePanel);
