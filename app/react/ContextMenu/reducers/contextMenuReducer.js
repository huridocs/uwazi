import Immutable from 'immutable';

import * as actions from 'app/ContextMenu/actions/actionTypes';
import * as ViewerActions from 'app/Viewer/actions/actionTypes';


const initialState = {open: false, menu: null};

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

  if (action.type === ViewerActions.OPEN_REFERENCE_PANEL) {
    return state.set('type', 'ViewerSaveReferenceMenu');
  }

  if (action.type === ViewerActions.UNSET_SELECTION || action.type === ViewerActions.LOAD_DEFAULT_VIEWER_MENU) {
    return state.set('type', 'ViewerDefaultMenu');
  }

  return Immutable.fromJS(state);
}
