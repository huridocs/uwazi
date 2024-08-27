import Immutable from 'immutable';
import * as types from 'app/Viewer/actions/actionTypes';

const initialState = { reference: {}, snippet: {}, enableClickAction: true, activeReferences: [] };

const unsetPanelsWhenUnsetSelections = ['targetReferencePanel', 'referencePanel'];

export default function (state = initialState, action = {}) {
  if (action.type === types.HIGHLIGHT_REFERENCE) {
    return state.set('highlightedReference', action.reference);
  }

  if (action.type === types.SELECT_SNIPPET) {
    return state.set('snippet', action.snippet);
  }

  if (action.type === types.GO_TO_ACTIVE) {
    return state.set('goToActive', action.value);
  }

  if (action.type === types.DEACTIVATE_REFERENCE) {
    return state.remove('activeReference').remove('activeReferences', action.references);
  }

  if (action.type === types.ACTIVE_REFERENCE) {
    return state.set('activeReference', action.reference);
  }

  if (action.type === types.ACTIVATE_MULTIPLE_REFERENCES) {
    return state.set('activeReferences', action.references);
  }

  if (action.type === types.OPEN_PANEL) {
    return state.set('panel', action.panel);
  }

  if (action.type === types.RESET_REFERENCE_CREATION) {
    return state.set('reference', Immutable.fromJS({}));
  }

  if (action.type === types.SET_SELECTION) {
    return state
      .setIn(['reference', 'sourceRange'], action.sourceRange)
      .setIn(['reference', 'sourceFile'], action.sourceFile);
  }

  if (action.type === types.SET_TARGET_SELECTION) {
    return state
      .setIn(['reference', 'targetRange'], action.targetRange)
      .setIn(['reference', 'targetFile'], action.targetFile);
  }

  if (action.type === types.UNSET_TARGET_SELECTION) {
    return state.setIn(['reference', 'targetRange'], null).setIn(['reference', 'targetFile'], null);
  }

  if (action.type === types.UNSET_SELECTION) {
    const newState = state
      .setIn(['reference', 'sourceRange'], null)
      .setIn(['reference', 'sourceFile'], null);
    if (unsetPanelsWhenUnsetSelections.indexOf(state.get('panel')) !== -1) {
      return newState.set('panel', false);
    }
    return newState;
  }

  if (action.type === 'viewer/targetDocHTML/SET' || action.type === types.CLOSE_PANEL) {
    return state.set('panel', false);
  }

  if (action.type === types.ADD_REFERENCE) {
    return state.set('reference', Immutable.fromJS({})).set('panel', false);
  }

  if (action.type === 'viewer/documentResults/SET') {
    let newState = state;
    const selectedInResults = action.value.find(
      result => result._id === state.getIn(['reference', 'targetDocument'])
    );
    if (!selectedInResults) {
      newState = state.deleteIn(['reference', 'targetDocument']);
    }
    return newState.set('viewerSearching', false);
  }

  if (action.type === types.SELECT_TARGET_DOCUMENT) {
    return state.setIn(['reference', 'targetDocument'], action.id);
  }

  if (action.type === types.RESET_DOCUMENT_VIEWER) {
    return Immutable.fromJS(initialState);
  }

  if (action.type === types.TOGGLE_REFERENCES) {
    const status = action.status || !state.get('enableClickAction');
    if (action.status !== state.get('enableClickAction')) {
      return state.set('enableClickAction', status).remove('activeReference');
    }
  }

  return Immutable.fromJS(state);
}
