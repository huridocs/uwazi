import qs from 'qs';
import { actions } from 'app/BasicReducer';
import { notificationActions } from 'app/Notifications';
import api from 'app/utils/api';
import debounce from 'app/utils/debounce';
import { RequestParams } from 'app/utils/RequestParams';
import { t } from 'app/I18N';

import * as types from './actionTypes';
import * as uiActions from './uiActions';

export function immediateSearch(dispatch, searchString, connectionType) {
  dispatch(uiActions.searching());

  const requestParams = new RequestParams(
    qs.stringify({
      filter: { searchString: searchString ? `title:(${searchString})` : undefined },
      fields: ['title', 'template', 'sharedId', 'documents._id'],
    })
  );

  return api.get('v2/search', requestParams).then(({ json: { data } }) => {
    let results = data;
    if (connectionType === 'targetRanged') {
      results = results.filter(r => r.documents && r.documents.length);
    }
    dispatch(actions.set('connections/searchResults', results));
  });
}

const debouncedSearch = debounce(immediateSearch, 400);

export function search(searchTerm, connectionType) {
  return dispatch => {
    dispatch(actions.set('connections/searchTerm', searchTerm));
    return debouncedSearch(dispatch, searchTerm, connectionType);
  };
}

export function startNewConnection(connectionType, sourceDocument) {
  return dispatch =>
    immediateSearch(dispatch, '', connectionType).then(() => {
      dispatch(actions.set('connections/searchTerm', ''));
      dispatch(uiActions.openPanel(connectionType, sourceDocument));
    });
}

export function setRelationType(template) {
  return {
    type: types.SET_RELATION_TYPE,
    template,
  };
}

export function setTargetDocument(id) {
  return {
    type: types.SET_TARGET_DOCUMENT,
    id,
  };
}

export function saveConnection(connection, callback = () => {}) {
  return (dispatch, getState) => {
    dispatch({ type: types.CREATING_CONNECTION });
    if (connection.type !== 'basic') {
      connection.language = getState().locale;
    }

    delete connection.type;

    const sourceRelationship = {
      entity: connection.sourceDocument,
      template: null,
      reference: connection.sourceRange,
      file: connection.sourceFile,
    };

    const targetRelationship = { entity: connection.targetDocument, template: connection.template };
    if (connection.targetRange) {
      Object.assign(targetRelationship, {
        reference: connection.targetRange,
        file: connection.targetFile,
      });
    }

    const apiCall = {
      delete: [],
      save: [[sourceRelationship, targetRelationship]],
    };

    return api.post('relationships/bulk', new RequestParams(apiCall)).then(response => {
      dispatch({ type: types.CONNECTION_CREATED });
      callback(response.json);
      dispatch(
        notificationActions.notify(t('System', 'Saved successfully.', null, false), 'success')
      );
    });
  };
}

export function selectRangedTarget(connection, onRangedConnect) {
  return dispatch => {
    dispatch({ type: types.CREATING_RANGED_CONNECTION });
    onRangedConnect(connection.targetDocument);
  };
}
