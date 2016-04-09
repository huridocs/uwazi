import * as types from 'app/Viewer/actions/actionTypes';

export function setReferences(references) {
  return {
    type: types.SET_REFERENCES,
    references
  };
}
