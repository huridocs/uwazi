import * as types from 'app/Viewer/actions/actionTypes';

export function setSelection(sourceRange) {
  return {
    type: types.SET_SELECTION,
    sourceRange
  };
}

export function setTargetSelection(targetRange) {
  return {
    type: types.SET_TARGET_SELECTION,
    targetRange
  };
}

export function unsetSelection() {
  return {
    type: types.UNSET_SELECTION
  };
}

export function unsetTargetSelection() {
  return {
    type: types.UNSET_TARGET_SELECTION
  };
}
