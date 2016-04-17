import * as actions from 'app/Viewer/actions/uiActions';
import * as types from 'app/Viewer/actions/actionTypes';

describe('openReferencePanel', () => {
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
});
