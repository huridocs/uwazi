import * as types from '#app/Relationships/actions/actionTypes.js';

export function openPanel() {
  return { type: types.OPEN_RELATIONSHIPS_PANEL };
}

export function closePanel() {
  return { type: types.CLOSE_RELATIONSHIPS_PANEL };
}

export function searching() {
  return { type: types.SEARCHING_RELATIONSHIPS };
}
