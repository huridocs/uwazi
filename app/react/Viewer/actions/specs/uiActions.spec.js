import * as actions from 'app/Viewer/actions/uiActions';
import * as types from 'app/Viewer/actions/actionTypes';

describe('Viewer uiActions', () => {
  describe('openReferencesPanel()', () => {
    it('should return a OPEN_VIEW_REFERENCES_PANEL', () => {
      let action = actions.openViewReferencesPanel();
      expect(action).toEqual({type: types.OPEN_VIEW_REFERENCES_PANEL});
    });
  });
  describe('openReferencePanel()', () => {
    it('should return a OPEN_REFERENCE_PANEL', () => {
      let action = actions.openReferencePanel();
      expect(action).toEqual({type: types.OPEN_REFERENCE_PANEL});
    });
  });
  describe('openTargetReferencePanel()', () => {
    it('should return a OPEN_TARGET_REFERENCE_PANEL', () => {
      let action = actions.openTargetReferencePanel();
      expect(action).toEqual({type: types.OPEN_TARGET_REFERENCE_PANEL});
    });
  });
  describe('viewerSearching()', () => {
    it('should return a VIEWER_SEARCHING', () => {
      let action = actions.viewerSearching();
      expect(action).toEqual({type: types.VIEWER_SEARCHING});
    });
  });
  describe('selectTargetDocument()', () => {
    it('should return a SELECT_TARGET_DOCUMENT with id', () => {
      let action = actions.selectTargetDocument('id');
      expect(action).toEqual({type: types.SELECT_TARGET_DOCUMENT, id: 'id'});
    });
  });
  describe('selectTargetDocument()', () => {
    it('should return a SELECT_TARGET_DOCUMENT with id', () => {
      let action = actions.selectTargetDocument('id');
      expect(action).toEqual({type: types.SELECT_TARGET_DOCUMENT, id: 'id'});
    });
  });
  describe('resetReferenceCreation()', () => {
    it('should return a RESET_REFERENCE_CREATION with id', () => {
      let action = actions.resetReferenceCreation();
      expect(action).toEqual({type: types.RESET_REFERENCE_CREATION});
    });
  });
  describe('highlightReference()', () => {
    it('should return a HIGHLIGHT_REFERENCE with id', () => {
      let action = actions.highlightReference('id');
      expect(action).toEqual({type: types.HIGHLIGHT_REFERENCE, reference: 'id'});
    });
  });
});
