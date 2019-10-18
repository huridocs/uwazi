"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = manageAttachmentsReducer;var _immutable = require("immutable");
var attachmentsTypes = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

const getId = (state, setInArray) => state.getIn(setInArray.concat(['_id']));

const getAttachments = (state, setInArray) => state.getIn(setInArray.concat(['attachments'])) || (0, _immutable.fromJS)([]);

function manageAttachmentsReducer(originalReducer, { useDefaults = true, setInArray = [] } = {}) {
  return (orignialState, originalAction) => {
    let state = orignialState;
    const action = originalAction || {};

    if (useDefaults) {
      state = orignialState || {};
    }

    if (action.type === attachmentsTypes.ATTACHMENT_COMPLETE && getId(state, setInArray) === action.entity) {
      const attachments = getAttachments(state, setInArray);
      return state.setIn(setInArray.concat(['attachments']), attachments.push((0, _immutable.fromJS)(action.file)));
    }

    if (action.type === attachmentsTypes.ATTACHMENT_DELETED && getId(state, setInArray) === action.entity) {
      const attachments = getAttachments(state, setInArray);
      const mainFile = state.getIn(setInArray.concat(['file'])) || (0, _immutable.fromJS)({});
      const deleteMainFile = mainFile.get('filename') === action.file.filename;
      const newState = deleteMainFile ? state.setIn(setInArray.concat(['file']), null) : state;
      return newState.setIn(setInArray.concat(['attachments']), attachments.filterNot(a => a.get('filename') === action.file.filename));
    }

    if (action.type === attachmentsTypes.ATTACHMENT_RENAMED && getId(state, setInArray) === action.entity) {
      if (getId(state, setInArray) === action.file._id) {
        return state.setIn(setInArray.concat(['file']), (0, _immutable.fromJS)(action.file));
      }

      const attachments = getAttachments(state, setInArray);
      return state.setIn(setInArray.concat(['attachments']), attachments.map(a => {
        if (a.get('_id') === action.file._id) {
          return a.set('originalname', action.file.originalname);
        }

        return a;
      }));
    }

    return originalReducer(state, action);
  };
}