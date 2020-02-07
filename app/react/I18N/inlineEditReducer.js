import Immutable from 'immutable';

const initialState = { inlineEdit: false, context: '', key: '', showInlineEditForm: false };

export default function inlineEditReducer(state = initialState, action = {}) {
  if (action.type === 'TOGGLE_INLINE_EDIT') {
    return state.set('inlineEdit', !state.get('inlineEdit'));
  }

  if (action.type === 'OPEN_INLINE_EDIT_FORM') {
    return state
      .set('showInlineEditForm', true)
      .set('context', action.context)
      .set('key', action.key);
  }

  if (action.type === 'CLOSE_INLINE_EDIT_FORM') {
    return state.set('showInlineEditForm', false);
  }

  return Immutable.fromJS(state);
}
