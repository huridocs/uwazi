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

export function search(searchTerm, connectionType) {
  return function (dispatch) {
    dispatch(searching());

    let query = {searchTerm, fields: ['doc.title']};

    return api.get('search', query)
    .then((response) => {
      let results = response.json.rows;
      if (connectionType === 'targetedRange') {
        results = results.filter(r => r.type !== 'entity');
      }
      dispatch(actions.set('connections/searchResults', results));
    });
  };
}

export function saveConnection(connection, callback) {
  return function (dispatch) {
    dispatch({type: types.CREATING_CONNECTION});
    return refenrecesAPI.save(connection)
    .then((referenceCreated) => {
      dispatch({
        type: types.CONNECTION_CREATED,
        connection: referenceCreated
      });
      callback(referenceCreated);
      dispatch(notify('saved successfully !', 'success'));
    });
  };
}
