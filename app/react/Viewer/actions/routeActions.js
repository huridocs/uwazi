import referencesAPI from 'app/Viewer/referencesAPI';
import relationTypesAPI from 'app/RelationTypes/RelationTypesAPI';
import referencesUtils from 'app/Viewer/utils/referencesUtils';
import {getDocument} from 'app/Viewer/actions/documentActions';
import {get as prioritySortingCriteria} from 'app/utils/prioritySortingCriteria';

import {actions} from 'app/BasicReducer';
import {setReferences} from './referencesActions';
import {actions as formActions} from 'react-redux-form';

export function requestViewerState(documentId, lang, globalResources) {
  return Promise.all([
    getDocument(documentId),
    referencesAPI.get(documentId),
    relationTypesAPI.get(),
    // TEST!!!
    referencesAPI.getGroupedByConnection(documentId)
  ])
  .then(([doc, references, relationTypes, connectionsGroups]) => {
    // TEST!!!
    const filteredTemplates = connectionsGroups.reduce((templateIds, group) => {
      return templateIds.concat(group.templates.map(t => t._id.toString()));
    }, []);

    const sortOptions = prioritySortingCriteria({currentCriteria: {}, filteredTemplates, templates: globalResources.templates});

    return Promise.all([doc, references, relationTypes, connectionsGroups, referencesAPI.search(documentId, sortOptions), sortOptions]);
    // ---
  })
  .then(([doc, references, relationTypes, connectionsGroups, searchResults, sort]) => {
    return {
      documentViewer: {
        doc,
        references: referencesUtils.filterRelevant(references, lang),
        relationTypes
      },
      // TEST!!!
      connectionsList: {
        entityId: doc.sharedId,
        entityMierda: doc.sharedId,
        entity: doc,
        connectionsGroups,
        searchResults,
        sort,
        filters: {},
        view: 'graph'
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
    dispatch(actions.set('connectionsList/entityId', state.connectionsList.entityId));
    dispatch(actions.set('connectionsList/entity', state.connectionsList.entity));
    dispatch(actions.set('connectionsList/connectionsGroups', state.connectionsList.connectionsGroups));
    dispatch(actions.set('connectionsList/searchResults', state.connectionsList.searchResults));
    dispatch(actions.set('connectionsList/filters', state.connectionsList.filters));
    dispatch(formActions.merge('connectionsList.sort', state.connectionsList.sort));
    dispatch(actions.set('connectionsList/view', state.connectionsList.view));
  };
}
