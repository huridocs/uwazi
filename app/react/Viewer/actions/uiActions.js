import * as types from 'app/Viewer/actions/actionTypes';

export function setTemplates(templates) {
  return {
    type: types.VIEWER_SET_TEMPLATES,
    templates
  };
}

export function setThesauris(thesauris) {
  return {
    type: types.VIEWER_SET_THESAURIS,
    thesauris
  };
}

export function openPanel(panel) {
  return {
    type: types.OPEN_PANEL,
    panel
  };
}

export function viewerSearching() {
  return {
    type: types.VIEWER_SEARCHING
  };
}

export function resetReferenceCreation() {
  return {
    type: types.RESET_REFERENCE_CREATION
  };
}

export function selectTargetDocument(id) {
  return {
    type: types.SELECT_TARGET_DOCUMENT,
    id
  };
}

export function highlightReference(reference) {
  return {
    type: types.HIGHLIGHT_REFERENCE,
    reference
  };
}

