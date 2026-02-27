import * as types from './actionTypes.js';

export function openPanel(connectionType, sourceDocument) {
  return {
    type: types.OPEN_CONNECTION_PANEL,
    sourceDocument,
    connectionType,
  };
}

export function closePanel() {
  return {
    type: types.CLOSE_CONNECTION_PANEL,
  };
}

export function searching() {
  return {
    type: types.SEARCHING_CONNECTIONS,
  };
}
