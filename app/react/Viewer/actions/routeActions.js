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

export async function requestViewerState(requestParams, globalResources) {
  const { sharedId, raw, page } = requestParams.data;
  const defaultLanguage = globalResources.settings.collection
    .get('languages')
    .find(l => l.get('default'))
    .get('key');

  const [
    doc,
    references,
    relationTypes,
    [connectionsGroups, searchResults, sort],
  ] = await Promise.all([
    getDocument(requestParams.set({ sharedId }), defaultLanguage, requestParams.data.file),
    referencesAPI.get(requestParams.set({ sharedId })),
    relationTypesAPI.get(requestParams.onlyHeaders()),
    relationships.requestState(requestParams.set({ sharedId }), globalResources.templates),
  ]);

  const { defaultDoc } = doc;
  const rawText = raw
    ? await entitiesAPI.getRawPage(requestParams.set({ _id: defaultDoc._id, page }))
    : '';

  return [
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
  ];
}
