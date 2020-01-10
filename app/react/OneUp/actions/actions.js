/** @format */

import { actions } from 'app/BasicReducer';
import { getAndLoadEntity } from 'app/Entities/actions/actions';
import api from 'app/Entities/EntitiesAPI';
import { wrapEntityMetadata } from 'app/Metadata/components/MetadataForm';
import { RequestParams } from 'app/utils/RequestParams';

export function toggleOneUpFullEdit() {
  return async (dispatch, getState) => {
    const state = getState();
    const oneUpState = state.oneUpReview.state.toJS();
    if (oneUpState.fullEdit && !state.entityView.entityFormState.$form.pristine) {
      const entity = await api.denormalize(
        new RequestParams(wrapEntityMetadata(state.entityView.entityForm))
      );
      dispatch(actions.set('entityView/entity', entity));
    }
    dispatch(
      actions.set('oneUpReview.state', {
        ...oneUpState,
        fullEdit: !oneUpState.fullEdit,
      })
    );
  };
}

export function switchOneUpEntity(delta, save) {
  return async (dispatch, getState) => {
    const state = getState();
    const oneUpState = state.oneUpReview.state.toJS();
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
      ...(await getAndLoadEntity(sharedId, templates, state, oneUpState.loadConnections)),
      actions.set('oneUpReview.state', {
        ...oneUpState,
        // fullEdit: false,
        indexInDocs: index,
      }),
    ].forEach(action => {
      dispatch(action);
    });
  };
}

export function toggleOneUpLoadConnections() {
  return async (dispatch, getState) => {
    const state = getState().oneUpReview.state.toJS();
    dispatch(
      actions.set('oneUpReview.state', {
        ...state,
        loadConnections: !state.loadConnections,
      })
    );
    dispatch(switchOneUpEntity(0, false));
  };
}
