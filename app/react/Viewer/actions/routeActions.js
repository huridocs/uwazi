import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import referencesUtils from 'app/Viewer/utils/referencesUtils';
import {getDocument} from 'app/Viewer/actions/documentActions';

import {actions} from 'app/BasicReducer';
import {setReferences} from './referencesActions';

export function requestViewerState(documentId, lang) {
  return Promise.all([
    getDocument(documentId),
    referencesAPI.get(documentId),
    relationTypesAPI.get()
  ])
  .then(([doc, references, relationTypes]) => {
    return {
      documentViewer: {
        doc,
        references: referencesUtils.filterRelevant(references, lang),
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
    dispatch(actions.set('viewer/doc', documentViewer.doc));
    dispatch(actions.set('viewer/relationTypes', documentViewer.relationTypes));
    dispatch(setReferences(documentViewer.references));
  };
}
