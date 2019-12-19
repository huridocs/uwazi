/** @format */

import { actions } from 'app/BasicReducer';
import api from 'app/Entities/EntitiesAPI';
import {
  removeDocument,
  removeDocuments,
  unselectAllDocuments,
  unselectDocument,
} from 'app/Library/actions/libraryActions';
import * as metadataActions from 'app/Metadata/actions/actions';
import { wrapEntityMetadata } from 'app/Metadata/components/MetadataForm';
import { notificationActions } from 'app/Notifications';
import { actions as relationshipActions } from 'app/Relationships';
import * as relationships from 'app/Relationships/utils/routeUtils';
import { advancedSort } from 'app/utils/advancedSort';
import { RequestParams } from 'app/utils/RequestParams';
import { actions as formActions } from 'react-redux-form';

export function saveEntity(entity) {
  return dispatch =>
    api.save(new RequestParams(entity)).then(response => {
      dispatch(notificationActions.notify('Entity saved', 'success'));
      dispatch(formActions.reset('entityView.entityForm'));
      dispatch(actions.set('entityView/entity', response));
      dispatch(relationshipActions.reloadRelationships(response.sharedId));
    });
}

export function deleteEntity(entity) {
  return dispatch =>
    api.delete(new RequestParams({ sharedId: entity.sharedId })).then(() => {
      dispatch(notificationActions.notify('Entity deleted', 'success'));
      dispatch(removeDocument(entity));
      dispatch(unselectDocument(entity._id));
    });
}

export function deleteEntities(entities) {
  return dispatch =>
    api.deleteMultiple(new RequestParams({ sharedIds: entities.map(e => e.sharedId) })).then(() => {
      dispatch(notificationActions.notify('Deletion success', 'success'));
      dispatch(unselectAllDocuments());
      dispatch(removeDocuments(entities));
    });
}

function loadEntity(entity, templates) {
  const form = 'entityView.entityForm';
  const sortedTemplates = advancedSort(templates, { property: 'name' });
  const defaultTemplate = sortedTemplates.find(t => t.default);
  const template = entity.template || defaultTemplate._id;
  const templateconfig = sortedTemplates.find(t => t._id === template);

  const metadata = metadataActions.UnwrapMetadataObject(
    metadataActions.resetMetadata(
      entity.metadata || {},
      templateconfig,
      { resetExisting: false },
      templateconfig
    ),
    templateconfig
  );
  // suggestedMetadata remains in metadata-object form (all components consuming it are new).
  return [
    formActions.reset(form),
    formActions.load(form, { ...entity, metadata, template }),
    formActions.setPristine(form),
  ];
}

export async function getAndLoadEntity(sharedId, templates, state) {
  const [[entity], [connectionsGroups, searchResults, sort, filters]] = await Promise.all([
    api.get(new RequestParams({ sharedId })),
    relationships.requestState(new RequestParams({ sharedId }), state),
  ]);

  return [
    actions.set('entityView/entity', entity),
    relationships.setReduxState({
      relationships: {
        list: {
          sharedId: entity.sharedId,
          entity,
          connectionsGroups,
          searchResults,
          sort,
          filters,
          view: 'graph',
        },
      },
    }),
    ...loadEntity(entity, templates),
  ];
}

export function toggleOneUpFullEdit() {
  return async (dispatch, getState) => {
    const state = getState().entityView.oneUpState.toJS();
    dispatch(
      actions.set('entityView.oneUpState', {
        ...state,
        fullEdit: !state.fullEdit,
      })
    );
  };
}

export function switchOneUpEntity(delta, save) {
  return async (dispatch, getState) => {
    const state = getState();
    if (save) {
      const entity = wrapEntityMetadata(state.entityView.entityForm);
      await api.save(new RequestParams(entity));
    }

    const templates = state.templates.toJS();
    const current = state.entityView.entity.get('sharedId');
    const index =
      state.library.documents.get('rows').findIndex(e => e.get('sharedId') === current) + delta;
    const sharedId = state.library.documents
      .get('rows')
      .get(index)
      .get('sharedId');

    [
      ...(await getAndLoadEntity(sharedId, templates, state)),
      actions.set('entityView.oneUpState', {
        ...state.entityView.oneUpState.toJS(),
        fullEdit: false,
        indexInDocs: index,
      }),
    ].forEach(action => {
      dispatch(action);
    });
  };
}
