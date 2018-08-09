import { actions } from 'app/BasicReducer';
import { getDocument } from 'app/Viewer/actions/documentActions';
import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import * as relationships from 'app/Relationships/utils/routeUtils';

import { setReferences } from './referencesActions';
import entitiesAPI from '../../Entities/EntitiesAPI';

export function requestViewerState({ documentId, raw, page }, globalResources) {
  return Promise.all([
    getDocument(documentId),
    referencesAPI.get(documentId),
    relationTypesAPI.get(),
    relationships.requestState(documentId, globalResources.templates),
    raw ? entitiesAPI.getRawPage(documentId, page) : ''
  ])
  .then(([doc, references, relationTypes, [connectionsGroups, searchResults, sort], rawPage]) => ({
    documentViewer: {
      doc,
      references,
      relationTypes,
      rawPage,
    },
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
    relationTypes,
  }));
}

export function setViewerState(state) {
  return (dispatch) => {
    const { documentViewer } = state;
    dispatch(actions.set('relationTypes', state.relationTypes));
    dispatch(actions.set('viewer/doc', documentViewer.doc));
    dispatch(actions.set('viewer/relationTypes', documentViewer.relationTypes));
    dispatch(actions.set('viewer/rawText', documentViewer.rawText));
    dispatch(setReferences(documentViewer.references));
    dispatch(relationships.setReduxState(state));
  };
}
