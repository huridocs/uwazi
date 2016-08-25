import api from '../EntitiesAPI';
import {notify} from 'app/Notifications';
import {actions as formActions} from 'react-redux-form';
import {actions} from 'app/BasicReducer';
import refenrecesAPI from 'app/Viewer/referencesAPI';

export function saveEntity(entity) {
  return function (dispatch) {
    return api.save(entity)
    .then((response) => {
      dispatch(notify('Entity saved', 'success'));
      dispatch(formActions.reset('entityView.entityForm'));
      dispatch(actions.set('entityView/entity', response));
    });
  };
}

export function deleteEntity(entity) {
  return function (dispatch) {
    return api.delete(entity)
    .then(() => {
      dispatch(notify('Entity deleted', 'success'));
    });
  };
}

export function deleteReference(reference) {
  return function (dispatch) {
    return refenrecesAPI.delete(reference)
    .then(() => {
      dispatch(actions.remove('entityView/references', reference));
      dispatch(notify('Connection deleted', 'success'));
    });
  };
}
