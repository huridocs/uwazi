import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import referencesUtils from 'app/Viewer/utils/referencesUtils';
import {getDocument} from 'app/Viewer/actions/documentActions';

import {actions} from 'app/BasicReducer';
import {setReferences} from './referencesActions';
import * as relationships from 'app/Relationships/utils/routeUtils';

export function requestViewerState(documentId, lang, globalResources) {
  return Promise.all([
    getDocument(documentId),
    referencesAPI.get(documentId),
    relationTypesAPI.get(),
    // TEST!!!
    relationships.requestState(documentId, globalResources.templates)
    // ---------
  ])
  .then(([doc, references, relationTypes, [connectionsGroups, searchResults, sort]]) => {
    return {
      documentViewer: {
        doc,
        references: referencesUtils.filterRelevant(references, lang),
        relationTypes
      },
      // TEST!!!
      relationships: {
        list: {
          entityId: doc.sharedId,
          entity: doc,
          connectionsGroups,
          searchResults,
          sort,
          filters: {},
          view: 'graph'
        }
      },
      // ----------
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

    // TEST!!!
    dispatch(relationships.setReduxState(state));
    // -------
  };
}
