import api from 'app/utils/api';
import referencesAPI from 'app/Viewer/referencesAPI';
import templatesAPI from 'app/Templates/TemplatesAPI';
import thesaurisAPI from 'app/Thesauris/ThesaurisAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import referencesUtils from 'app/Viewer/utils/referencesUtils';

import {actions} from 'app/BasicReducer';
import {setReferences} from './referencesActions';

export function requestViewerState(documentId, lang) {
  return Promise.all([
    api.get('documents', {_id: documentId}),
    referencesAPI.get(documentId),
    templatesAPI.get(),
    thesaurisAPI.get(),
    relationTypesAPI.get()
  ])
  .then(([doc, references, templates, thesauris, relationTypes]) => {
    return {
      templates,
      thesauris,
      documentViewer: {
        doc: doc.json.rows[0],
        references: referencesUtils.filterRelevant(references, lang),
        templates,
        thesauris,
        relationTypes
      },
      relationTypes
    };
  });
}

export function setViewerState(state) {
  return function (dispatch) {
    const {documentViewer} = state;
    dispatch(actions.set('relationTypes', state.relationTypes));
    dispatch(actions.set('viewer/docHTML', documentViewer.docHTML));
    dispatch(actions.set('viewer/doc', documentViewer.doc));
    dispatch(actions.set('viewer/templates', documentViewer.templates));
    dispatch(actions.set('templates', documentViewer.templates));
    dispatch(actions.set('viewer/thesauris', documentViewer.thesauris));
    dispatch(actions.set('thesauris', documentViewer.thesauris));
    dispatch(actions.set('viewer/relationTypes', documentViewer.relationTypes));
    dispatch(setReferences(documentViewer.references));
  };
}
