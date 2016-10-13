import {actions} from 'app/BasicReducer';
import {notify} from 'app/Notifications';
import api from 'app/utils/api';
import referencesAPI from 'app/Viewer/referencesAPI';
import debounce from 'app/utils/debounce';

import * as types from './actionTypes';
import * as uiActions from './uiActions';

export function immidiateSearch(dispatch, searchTerm, connectionType) {
  dispatch(uiActions.searching());

  let query = {searchTerm, fields: ['doc.title']};

  return api.get('search', query)
  .then((response) => {
    let results = response.json.rows;
    if (connectionType === 'targetRanged') {
      results = results.filter(r => r.type !== 'entity');
    }
    dispatch(actions.set('connections/searchResults', results));
  });
}

const debouncedSearch = debounce(immidiateSearch, 400);

export function search(searchTerm, connectionType) {
  return function (dispatch) {
    dispatch(actions.set('connections/searchTerm', searchTerm));
    return debouncedSearch(dispatch, searchTerm, connectionType);
  };
}

export function startNewConnection(connectionType, sourceDocument) {
  return function (dispatch) {
    return immidiateSearch(dispatch, '', connectionType)
    .then(() => {
      dispatch(actions.set('connections/searchTerm', ''));
      dispatch(uiActions.openPanel(connectionType, sourceDocument));
    });
  };
}

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

export function saveConnection(connection, callback) {
  return function (dispatch) {
    dispatch({type: types.CREATING_CONNECTION});
    delete connection.type;

    return referencesAPI.save(connection)
    .then((referenceCreated) => {
      dispatch({type: types.CONNECTION_CREATED, connection: referenceCreated});
      callback(referenceCreated);
      dispatch(notify('saved successfully !', 'success'));
    });
  };
}

export function selectRangedTarget(connection, onRangedConnect) {
  return function (dispatch) {
    dispatch({type: types.CREATING_RANGED_CONNECTION});
    onRangedConnect(connection.targetDocument);
  };
}
