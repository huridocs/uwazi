import Immutable from 'immutable';

import * as actions from 'app/ContextMenu/actions/actionTypes';
import * as ViewerActions from 'app/Viewer/actions/actionTypes';

const initialState = {open: false, menu: null};

const panels = {
  referencePanel: 'ViewerSaveReferenceMenu',
  targetReferencePanel: 'ViewerSaveTargetReferenceMenu'
};

export default function contextMenuReducer(state = initialState, action = {}) {
  if (action.type === actions.OPEN_MENU) {
    return state.set('open', true);
  }

  if (action.type === actions.CLOSE_MENU) {
    return state.set('open', false);
  }

  if (action.type === ViewerActions.SET_SELECTION) {
    return state.set('type', 'ViewerTextSelectedMenu');
  }

  if (action.type === ViewerActions.OPEN_PANEL) {
    return state.set('type', panels[action.panel]);
  }

  if (action.type === ViewerActions.UNSET_SELECTION || action.type === ViewerActions.LOAD_DEFAULT_VIEWER_MENU
    || action.type === ViewerActions.ADD_CREATED_REFERENCE) {
    return state.set('type', 'ViewerDefaultMenu');
  }

  return Immutable.fromJS(state);
}
