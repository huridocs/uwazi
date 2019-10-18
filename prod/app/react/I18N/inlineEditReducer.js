"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = inlineEditReducer;var _immutable = _interopRequireDefault(require("immutable"));function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

const initialState = { inlineEdit: false, context: '', key: '', showInlineEditForm: false };

function inlineEditReducer(state = initialState, action = {}) {
  if (action.type === 'TOGGLE_INLINE_EDIT') {
    return state.set('inlineEdit', !state.get('inlineEdit'));
  }

  if (action.type === 'OPEN_INLINE_EDIT_FORM') {
    return state.set('showInlineEditForm', true).
    set('context', action.context).
    set('key', action.key);
  }

  if (action.type === 'CLOSE_INLINE_EDIT_FORM') {
    return state.set('showInlineEditForm', false);
  }

  return _immutable.default.fromJS(state);
}