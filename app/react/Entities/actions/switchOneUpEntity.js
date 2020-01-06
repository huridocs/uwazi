import { actions } from 'app/BasicReducer';
import api from 'app/Entities/EntitiesAPI';
import { wrapEntityMetadata } from 'app/Metadata/components/MetadataForm';
import { RequestParams } from 'app/utils/RequestParams';
import { getAndLoadEntity } from './actions';
export function switchOneUpEntity(delta, save) {
  return async (dispatch, getState) => {
    const state = getState();
    const oneUpState = state.entityView.oneUpState.toJS();
    if (save) {
      const entity = wrapEntityMetadata(state.entityView.entityForm);
      await api.save(new RequestParams(entity));
    }
    const templates = state.templates.toJS();
    const current = state.entityView.entity.get('sharedId');
    const index = state.library.documents.get('rows').findIndex(e => e.get('sharedId') === current) + delta;
    const sharedId = state.library.documents
      .get('rows')
      .get(index)
      .get('sharedId');
    [
      ...(await getAndLoadEntity(sharedId, templates, state, oneUpState.loadConnections)),
      actions.set('entityView.oneUpState', {
        ...oneUpState,
        fullEdit: false,
        indexInDocs: index,
      }),
    ].forEach(action => {
      dispatch(action);
    });
  };
}
