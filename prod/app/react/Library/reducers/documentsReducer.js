"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = documents;var _immutable = _interopRequireDefault(require("immutable"));

var types = _interopRequireWildcard(require("../actions/actionTypes"));
var uploadTypes = _interopRequireWildcard(require("../../Uploads/actions/actionTypes"));
var attachmentsTypes = _interopRequireWildcard(require("../../Attachments/actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const initialState = { rows: [] };

function documents(state = initialState, action = {}) {
  if (action.type === types.SET_DOCUMENTS) {
    return _immutable.default.fromJS(action.documents);
  }

  if (action.type === types.UPDATE_DOCUMENT) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('_id') === action.doc._id);
    return state.setIn(['rows', docIndex], _immutable.default.fromJS(action.doc));
  }

  if (action.type === types.UPDATE_DOCUMENT) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('_id') === action.doc._id);
    return state.setIn(['rows', docIndex], _immutable.default.fromJS(action.doc));
  }

  if (action.type === attachmentsTypes.UPDATE_DOCUMENT_FILE) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('_id') === action.entity);
    return state.setIn(['rows', docIndex, 'file'], _immutable.default.fromJS(action.file));
  }

  if (action.type === types.UPDATE_DOCUMENTS) {
    return action.docs.reduce((_state, doc) => {
      const docIndex = state.get('rows').findIndex(_doc => _doc.get('_id') === doc._id);

      return _state.setIn(['rows', docIndex], _immutable.default.fromJS(doc));
    }, state);
  }

  if (action.type === types.ELEMENT_CREATED) {
    return state.update('rows', rows => rows.insert(0, _immutable.default.fromJS(action.doc)));
  }

  if (action.type === uploadTypes.UPLOAD_COMPLETE) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('sharedId') === action.doc);

    const doc = state.get('rows').get(docIndex).toJS();
    doc.uploaded = true;
    doc.file = action.file;
    return state.setIn(['rows', docIndex], _immutable.default.fromJS(doc));
  }

  if (action.type === uploadTypes.DOCUMENT_PROCESSED) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('sharedId') === action.sharedId);

    const doc = state.get('rows').get(docIndex).toJS();
    doc.processed = true;
    return state.setIn(['rows', docIndex], _immutable.default.fromJS(doc));
  }

  if (action.type === uploadTypes.DOCUMENT_PROCESS_ERROR) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('sharedId') === action.sharedId);

    const doc = state.get('rows').get(docIndex).toJS();
    doc.processed = false;
    return state.setIn(['rows', docIndex], _immutable.default.fromJS(doc));
  }

  if (action.type === types.REMOVE_DOCUMENT) {
    const docIndex = state.get('rows').findIndex(doc => doc.get('_id') === action.doc._id);

    if (docIndex >= 0) {
      return state.deleteIn(['rows', docIndex]);
    }

    return state;
  }

  if (action.type === types.UNSET_DOCUMENTS) {
    return _immutable.default.fromJS(initialState);
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

  return _immutable.default.fromJS(state);
}