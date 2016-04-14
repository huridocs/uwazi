import * as types from 'app/Viewer/actions/actionTypes';

export function setSelection(sourceRange) {
  return {
    type: types.SET_SELECTION,
    sourceRange
  };
}

export function unsetSelection() {
  return {
    type: types.UNSET_SELECTION
  };
}
