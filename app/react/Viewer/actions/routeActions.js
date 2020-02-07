import { actions } from 'app/BasicReducer';
import { getDocument } from 'app/Viewer/actions/documentActions';
import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import * as relationships from 'app/Relationships/utils/routeUtils';

import { setReferences } from './referencesActions';
import entitiesAPI from '../../Entities/EntitiesAPI';

export function setViewerState(state) {
  return dispatch => {
    const { documentViewer } = state;
    dispatch(actions.set('relationTypes', state.relationTypes));
    dispatch(actions.set('viewer/doc', documentViewer.doc));
    dispatch(actions.set('viewer/relationTypes', documentViewer.relationTypes));
    dispatch(actions.set('viewer/rawText', documentViewer.rawText));
    dispatch(setReferences(documentViewer.references));
    dispatch(relationships.setReduxState(state));
  };
}

export function requestViewerState(requestParams, globalResources) {
  const { sharedId, raw, page } = requestParams.data;
  return Promise.all([
    getDocument(requestParams.set({ sharedId })),
    referencesAPI.get(requestParams.set({ sharedId })),
    relationTypesAPI.get(requestParams.onlyHeaders()),
    relationships.requestState(requestParams.set({ sharedId }), globalResources.templates),
    raw ? entitiesAPI.getRawPage(requestParams.set({ sharedId, pageNumber: page })) : '',
  ]).then(([doc, references, relationTypes, [connectionsGroups, searchResults, sort], rawText]) => [
    setViewerState({
      documentViewer: {
        doc,
        references,
        relationTypes,
        rawText,
      },
      relationships: {
        list: {
          sharedId: doc.sharedId,
          entity: doc,
          connectionsGroups,
          searchResults,
          sort,
          filters: {},
          view: 'graph',
        },
      },
      relationTypes,
    }),
  ]);
}
