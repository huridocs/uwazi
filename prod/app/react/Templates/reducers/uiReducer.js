"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = templatesUI;var _immutable = _interopRequireDefault(require("immutable"));

var actions = _interopRequireWildcard(require("../actions/actionTypes"));function _interopRequireWildcard(obj) {if (obj && obj.__esModule) {return obj;} else {var newObj = {};if (obj != null) {for (var key in obj) {if (Object.prototype.hasOwnProperty.call(obj, key)) {var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {};if (desc.get || desc.set) {Object.defineProperty(newObj, key, desc);} else {newObj[key] = obj[key];}}}}newObj.default = obj;return newObj;}}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const initialState = { thesauris: [], templates: [], propertyBeingDeleted: null };

function templatesUI(state = initialState, action = {}) {
  if (action.type === actions.EDIT_PROPERTY) {
    return state.set('editingProperty', action.id);
  }

  if (action.type === actions.SET_THESAURIS) {
    return state.set('thesauris', action.thesauris);
  }

  if (action.type === actions.SET_TEMPLATES) {
    return state.set('templates', action.templates);
  }

  if (action.type === actions.SAVING_TEMPLATE) {
    return state.set('savingTemplate', true);
  }

  if (action.type === actions.TEMPLATE_SAVED) {
    return state.set('savingTemplate', false);
  }

  return _immutable.default.fromJS(state);
}