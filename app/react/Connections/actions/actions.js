import {actions} from 'app/BasicReducer';
import {notify} from 'app/Notifications';
import refenrecesAPI from 'app/Viewer/referencesAPI';
import api from 'app/utils/api';

import {searching} from './uiActions';
import * as types from './actionTypes';

export function setRelationType(relationType) {
  return {
    type: types.SET_RELATION_TYPE,
    relationType
  };
}

export function setTargetDocument(id) {
  return {
    type: types.SET_TARGET_DOCUMENT,
    id
  };
}

export function search(searchTerm) {
  return function (dispatch) {
    dispatch(searching());

    let query = {
      searchTerm,
      fields: ['doc.title']
    };

    return api.get('search', query)
    .then((response) => {
      dispatch(actions.set('connections/searchResults', response.json.rows));
    });
  };
}

export function saveConnection(connection) {
  return function (dispatch) {
    dispatch({type: types.CREATING_CONNECTION});
    return refenrecesAPI.save(connection)
    .then((referenceCreated) => {
      // REMOVE TIMEOUT!
      setTimeout(() => {
        dispatch({
          type: types.CONNECTION_CREATED,
          connection: referenceCreated
        });

        // dispatch(actions.unset('viewer/targetDoc'));
        // dispatch(actions.unset('viewer/targetDocHTML'));
        // dispatch(actions.unset('viewer/targetDocReferences'));

        // dispatch(uiActions.activateReference(referenceCreated._id, tab));
        dispatch(notify('saved successfully !', 'success'));
      }, 1000);
    });
  };
}
