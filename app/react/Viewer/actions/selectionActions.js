import * as types from 'app/Viewer/actions/actionTypes';

export function setSelection(selection) {
  return {
    type: types.SET_SELECTION,
    selection
  };
}

export function unsetSelection() {
  return {
    type: types.UNSET_SELECTION
  };
}
