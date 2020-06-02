import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';
import * as uploadTypes from 'app/Uploads/actions/actionTypes';

const initialState = { rows: [], totalRows: 0 };

export default function documents(state = initialState, action = {}) {
  if (action.type === types.SET_DOCUMENTS) {
    return Immutable.fromJS(action.documents);
  }

  if (action.type === types.ADD_DOCUMENTS) {
    return state
      .setIn(['rows'], state.get('rows').concat(Immutable.fromJS(action.documents.rows)))
      .setIn(['totalRows'], action.documents.totalRows);
  }

  if (action.type === types.UPDATE_DOCUMENT) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('_id') === action.doc._id);
    return state.setIn(['rows', docIndex], Immutable.fromJS(action.doc));
  }

  if (action.type === types.UPDATE_DOCUMENTS) {
    return action.docs.reduce((_state, doc) => {
      const docIndex = state.get('rows').findIndex(_doc => _doc.get('_id') === doc._id);

      return _state.setIn(['rows', docIndex], Immutable.fromJS(doc));
    }, state);
  }

  if (action.type === types.ELEMENT_CREATED) {
    return state.update('rows', rows => rows.insert(0, Immutable.fromJS(action.doc)));
  }

  if (action.type === uploadTypes.UPLOAD_COMPLETE) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('sharedId') === action.doc);

    const doc = state
      .get('rows')
      .get(docIndex)
      .toJS();
    doc.documents.push(action.file);
    return state.setIn(['rows', docIndex], Immutable.fromJS(doc));
  }

  if (action.type === uploadTypes.DOCUMENT_PROCESSED) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('sharedId') === action.sharedId);

    const doc = state
      .get('rows')
      .get(docIndex)
      .toJS();
    doc.documents[0].status = 'ready';
    return state.setIn(['rows', docIndex], Immutable.fromJS(doc));
  }

  if (action.type === uploadTypes.DOCUMENT_PROCESS_ERROR) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('sharedId') === action.sharedId);

    const doc = state
      .get('rows')
      .get(docIndex)
      .toJS();
    doc.documents[0].status = 'failed';
    return state.setIn(['rows', docIndex], Immutable.fromJS(doc));
  }

  if (action.type === types.REMOVE_DOCUMENT) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('_id') === action.doc._id);

    if (docIndex >= 0) {
      return state.deleteIn(['rows', docIndex]);
    }

    return state;
  }

  if (action.type === types.UNSET_DOCUMENTS) {
    return Immutable.fromJS(initialState);
  }

  if (action.type === types.REMOVE_DOCUMENTS) {
    return action.docs.reduce((_state, doc) => {
      const docIndex = _state.get('rows').findIndex(_doc => _doc.get('_id') === doc._id);

      if (docIndex >= 0) {
        return _state.deleteIn(['rows', docIndex]);
      }
      return _state;
    }, state);
  }

  return Immutable.fromJS(state);
}
