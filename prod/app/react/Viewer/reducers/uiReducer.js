"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = _default;var _immutable = _interopRequireDefault(require("immutable"));
var types = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const initialState = { reference: {}, snippet: {} };

const unsetPanelsWhenUnsetSelections = ['targetReferencePanel', 'referencePanel'];

function _default(state = initialState, action = {}) {
  if (action.type === types.HIGHLIGHT_REFERENCE) {
    return state.set('highlightedReference', action.reference);
  }

  if (action.type === types.SELECT_SNIPPET) {
    return state.set('snippet', action.snippet);
  }

  if (action.type === types.GO_TO_ACTIVE) {
    return state.set('goToActive', action.value);
  }

  if (action.type === types.DEACTIVATE_REFERENCE) {
    return state.remove('activeReference');
  }

  if (action.type === types.ACTIVE_REFERENCE) {
    return state.set('activeReference', action.reference);
  }

  if (action.type === types.OPEN_PANEL) {
    return state.set('panel', action.panel);
  }

  if (action.type === types.RESET_REFERENCE_CREATION) {
    return state.set('reference', _immutable.default.fromJS({}));
  }

  if (action.type === types.SET_SELECTION) {
    return state.setIn(['reference', 'sourceRange'], action.sourceRange);
  }

  if (action.type === types.SET_TARGET_SELECTION) {
    return state.setIn(['reference', 'targetRange'], action.targetRange);
  }

  if (action.type === types.UNSET_TARGET_SELECTION) {
    return state.setIn(['reference', 'targetRange'], null);
  }

  if (action.type === types.UNSET_SELECTION) {
    const newState = state.setIn(['reference', 'sourceRange'], null);
    if (unsetPanelsWhenUnsetSelections.indexOf(state.get('panel')) !== -1) {
      return newState.set('panel', false);
    }
    return newState;
  }

  if (action.type === 'viewer/targetDocHTML/SET' || action.type === types.CLOSE_PANEL) {
    return state.set('panel', false);
  }

  if (action.type === types.ADD_REFERENCE) {
    return state.set('reference', _immutable.default.fromJS({})).set('panel', false);
  }

  if (action.type === 'viewer/documentResults/SET') {
    let newState = state;
    const selectedInResults = action.value.find(result => result._id === state.getIn(['reference', 'targetDocument']));
    if (!selectedInResults) {
      newState = state.deleteIn(['reference', 'targetDocument']);
    }
    return newState.set('viewerSearching', false);
  }

  if (action.type === types.SELECT_TARGET_DOCUMENT) {
    return state.setIn(['reference', 'targetDocument'], action.id);
  }

  if (action.type === types.RESET_DOCUMENT_VIEWER) {
    return _immutable.default.fromJS(initialState);
  }

  return _immutable.default.fromJS(state);
}