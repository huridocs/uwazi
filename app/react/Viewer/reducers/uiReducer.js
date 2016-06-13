import Immutable from 'immutable';
import * as types from 'app/Viewer/actions/actionTypes';

const initialState = {reference: {}};

let unsetPanelsWhenUnsetSelections = ['targetReferencePanel', 'referencePanel'];

export default function (state = initialState, action = {}) {
  if (action.type === types.HIGHLIGHT_REFERENCE) {
    return state.set('highlightedReference', action.reference);
  }

  if (action.type === types.DEACTIVATE_REFERENCE) {
    return state.remove('activeReference');
  }

  if (action.type === types.ACTIVE_REFERENCE) {
    return state.set('activeReference', action.reference);
  }

  if (action.type === types.OPEN_PANEL) {
    return state.set('panel', action.panel);
  }

  if (action.type === types.VIEWER_SEARCHING) {
    return state.set('viewerSearching', true);
  }

  if (action.type === types.RESET_REFERENCE_CREATION) {
    return state.set('reference', Immutable.fromJS({}));
  }

  if (action.type === types.SET_RELATION_TYPE) {
    return state.setIn(['reference', 'relationType'], action.relationType);
  }

  if (action.type === types.SET_SELECTION) {
    return state.setIn(['reference', 'sourceRange'], action.sourceRange);
  }

  if (action.type === types.SET_TARGET_SELECTION) {
    return state.setIn(['reference', 'targetRange'], action.targetRange);
  }

  if (action.type === types.UNSET_TARGET_SELECTION) {
    return state.setIn(['reference', 'targetRange'], null);
  }

  if (action.type === types.UNSET_SELECTION) {
    let newState = state.setIn(['reference', 'sourceRange'], null);
    if (unsetPanelsWhenUnsetSelections.indexOf(state.get('panel')) !== -1) {
      return newState.set('panel', false);
    }
    return newState;
  }

  if (action.type === 'viewer/targetDocHTML/SET' || action.type === types.CLOSE_PANEL) {
    return state.set('panel', false);
  }

  if (action.type === types.ADD_CREATED_REFERENCE) {
    return state.set('reference', Immutable.fromJS({})).set('panel', false);
  }

  if (action.type === 'viewer/documentResults/SET') {
    let newState = state;
    let selectedInResults = action.value.find((result) => result._id === state.getIn(['reference', 'targetDocument']));
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

  return Immutable.fromJS(state);
}
