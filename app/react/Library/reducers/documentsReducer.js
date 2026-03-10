import Immutable from 'immutable';

import * as types from 'app/Library/actions/actionTypes';
import * as uploadTypes from 'app/Uploads/actions/actionTypes';
import * as attachmentTypes from 'app/Attachments/actions/actionTypes';

const initialState = { rows: [], totalRows: 0 };

const getBySharedId = (state, action) => {
  const docIndex = state.get('rows').findIndex(_doc => _doc.get('sharedId') === action.entity);
  const doc = state.get('rows').get(docIndex).toJS();
  return { docIndex, doc };
};

const getFilterByObjectWithId = itemToSearch => candidateItem =>
  candidateItem.get('_id') === itemToSearch._id;

const getFilterBySharedId = sharedIdToSearch => candidateItem =>
  candidateItem.get('sharedId') === sharedIdToSearch;

const removeDocuments = (items, currentState, getFilter, updateTotalRows = false) =>
  items.reduce((_state, item) => {
    const docIndex = _state.get('rows').findIndex(getFilter(item));

    if (docIndex >= 0) {
      const newState = _state.deleteIn(['rows', docIndex]);
      if (!updateTotalRows) {
        return newState;
      }
      return newState.set('totalRows', newState.get('totalRows') - 1);
    }
    return _state;
  }, currentState);

// eslint-disable-next-line max-statements
export const documentsReducer = (state = initialState, action = {}) => {
  let docIndex = 0;
  let doc;
  let file;

  switch (action.type) {
    case types.SET_DOCUMENTS:
      return Immutable.fromJS(action.documents);

    case types.UNSET_DOCUMENTS:
      return Immutable.fromJS(initialState);

    case types.ADD_DOCUMENTS:
      return state
        .setIn(['rows'], state.get('rows').concat(Immutable.fromJS(action.documents.rows)))
        .setIn(['totalRows'], action.documents.totalRows);

    case types.UPDATE_DOCUMENT:
      docIndex = state.get('rows').findIndex(_doc => _doc.get('_id') === action.doc._id);
      return state.setIn(['rows', docIndex], Immutable.fromJS(action.doc));

    case types.UPDATE_DOCUMENTS:
      return action.docs.reduce((_state, document) => {
        const index = state.get('rows').findIndex(_doc => _doc.get('_id') === document._id);
        return _state.setIn(['rows', index], Immutable.fromJS(document));
      }, state);

    case types.UPDATE_DOCUMENTS_PUBLISHED:
      return action.sharedIds.reduce((_state, sharedId) => {
        const index = state.get('rows').findIndex(_doc => _doc.get('sharedId') === sharedId);
        return _state.setIn(['rows', index, 'published'], action.published);
      }, state);

    case types.ELEMENT_CREATED:
      return state.update('rows', rows => rows.insert(0, Immutable.fromJS(action.doc)));

    case types.REMOVE_DOCUMENT:
      docIndex = state.get('rows').findIndex(_doc => _doc.get('_id') === action.doc._id);
      if (docIndex >= 0) {
        return state.deleteIn(['rows', docIndex]);
      }
      return state;

    case types.REMOVE_DOCUMENTS:
      return removeDocuments(action.docs, state, getFilterByObjectWithId);

    case types.REMOVE_DOCUMENTS_SHAREDIDS:
      return removeDocuments(action.sharedIds, state, getFilterBySharedId, true);

    case uploadTypes.UPLOAD_COMPLETE:
      docIndex = state.get('rows').findIndex(_doc => _doc.get('sharedId') === action.doc);
      if (docIndex >= 0) {
        doc = state.get('rows').get(docIndex).toJS();
        doc.documents.push(action.file);
        return state.setIn(['rows', docIndex], Immutable.fromJS(doc));
      }
      break;

    case uploadTypes.UPLOADS_COMPLETE:
      docIndex = state.get('rows').findIndex(_doc => _doc.get('sharedId') === action.doc);
      if (docIndex >= 0) {
        doc = state.get('rows').get(docIndex).toJS();
        return state.setIn(
          ['rows', docIndex],
          Immutable.fromJS({ ...doc, documents: action.files })
        );
      }
      break;

    case attachmentTypes.ATTACHMENT_COMPLETE:
      ({ docIndex, doc } = getBySharedId(state, action));
      doc.attachments.push(action.file);
      return state.setIn(['rows', docIndex], Immutable.fromJS(doc));

    case attachmentTypes.ATTACHMENT_DELETED:
      ({ docIndex, doc } = getBySharedId(state, action));
      doc.attachments = doc.attachments.filter(att => att._id !== action.file._id);
      return state.setIn(['rows', docIndex], Immutable.fromJS(doc));

    case attachmentTypes.ATTACHMENT_RENAMED:
      ({ docIndex, doc } = getBySharedId(state, action));
      [file] = doc.attachments.filter(att => att._id === action.file._id);
      file.originalname = action.file.originalname;
      return state.setIn(['rows', docIndex], Immutable.fromJS(doc));

    default:
      break;
  }

  return Immutable.fromJS(state);
};
