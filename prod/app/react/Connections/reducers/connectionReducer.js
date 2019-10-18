"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;var _immutable = require("immutable");

var viewerTypes = _interopRequireWildcard(require("../../Viewer/actions/actionTypes"));

var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}

const initialState = { template: '', targetDocument: '', sourceDocument: '' };

const resetState = state => {
  const propertiesToReset = ['template', 'targetDocument', 'sourceDocument'];
  const newState = state.toJS();
  propertiesToReset.forEach(key => {
    newState[key] = '';
  });
  return (0, _immutable.fromJS)(newState);
};

function _default(state = initialState, action = {}) {
  let newState;

  switch (action.type) {
    case types.OPEN_CONNECTION_PANEL:
      newState = resetState(state.set('type', action.connectionType));
      return newState.set('sourceDocument', action.sourceDocument);

    case types.SET_RELATION_TYPE:
      return state.set('template', action.template);

    case types.SET_TARGET_DOCUMENT:
      return state.set('targetDocument', action.id);

    case 'connections/searchResults/SET':
      if (!action.value.find(v => v.sharedId === state.get('targetDocument'))) {
        return state.delete('targetDocument');
      }
      return state;

    case viewerTypes.SET_SELECTION:
      return state.set('sourceRange', action.sourceRange);

    case viewerTypes.UNSET_SELECTION:
    case types.CONNECTION_CREATED:
      return state.delete('sourceRange');

    default:
      return (0, _immutable.fromJS)(state);}

}