import * as types from 'app/Viewer/actions/actionTypes';

export function setSelection(sourceRange, sourceFile) {
  return {
    type: types.SET_SELECTION,
    sourceRange,
    sourceFile,
  };
}

export function setTargetSelection(targetRange, targetFile) {
  return {
    type: types.SET_TARGET_SELECTION,
    targetRange,
    targetFile,
  };
}

export function unsetSelection() {
  return {
    type: types.UNSET_SELECTION,
  };
}

export function unsetTargetSelection() {
  return {
    type: types.UNSET_TARGET_SELECTION,
  };
}
