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
  const viewerStateStart = performance.now();
  const { sharedId, raw, page } = requestParams.data;
  const defaultLanguage = globalResources.settings.collection
    .get('languages')
    .find(l => l.get('default'));

  const parallelStart = performance.now();
  const [doc, relationTypes, [connectionsGroups, searchResults, sort]] = await Promise.all([
    (async () => {
      const start = performance.now();
      const result = await getDocument(
        requestParams.set({ sharedId }),
        defaultLanguage ? defaultLanguage.get('key') : 'en',
        requestParams.data.file
      );
      console.log('[PERF][PDFView] getDocument():', (performance.now() - start).toFixed(2), 'ms');
      return result;
    })(),
    (async () => {
      const start = performance.now();
      const result = await relationTypesAPI.get(requestParams.onlyHeaders());
      console.log(
        '[PERF][PDFView] relationTypesAPI.get():',
        (performance.now() - start).toFixed(2),
        'ms'
      );
      return result;
    })(),
    (async () => {
      const start = performance.now();
      const result = await relationships.requestState(
        requestParams.set({ sharedId }),
        globalResources.templates
      );
      console.log(
        '[PERF][PDFView] relationships.requestState():',
        (performance.now() - start).toFixed(2),
        'ms'
      );
      return result;
    })(),
  ]);
  console.log(
    '[PERF][PDFView] Parallel Promise.all completed:',
    (performance.now() - parallelStart).toFixed(2),
    'ms'
  );

  const { defaultDoc } = doc;
  const rawText = raw
    ? await entitiesAPI.getRawPage(requestParams.set({ _id: defaultDoc._id, page }))
    : '';

  const referencesStart = performance.now();
  const references = await referencesAPI.get(
    requestParams.set({ sharedId, file: doc.defaultDoc._id, onlyTextReferences: true })
  );
  console.log(
    '[PERF][PDFView] referencesAPI.get():',
    (performance.now() - referencesStart).toFixed(2),
    'ms'
  );

  const statePreparationStart = performance.now();
  const result = [
    setViewerState({
      documentViewer: {
        doc: {
          ...doc,
          relations: references,
        },
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
  console.log(
    '[PERF][PDFView] State preparation:',
    (performance.now() - statePreparationStart).toFixed(2),
    'ms'
  );
  console.log(
    '[PERF][PDFView] TOTAL requestViewerState:',
    (performance.now() - viewerStateStart).toFixed(2),
    'ms'
  );

  return result;
}
