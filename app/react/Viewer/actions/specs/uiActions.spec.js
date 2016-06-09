import * as actions from 'app/Viewer/actions/uiActions';
import * as types from 'app/Viewer/actions/actionTypes';
import scroller from 'app/Viewer/utils/Scroller';

describe('Viewer uiActions', () => {
  describe('closePanel()', () => {
    it('should return a CLOSE_PANEL with panel passed', () => {
      let action = actions.closePanel();
      expect(action).toEqual({type: types.CLOSE_PANEL});
    });
  });
  describe('openPanel()', () => {
    it('should return a OPEN_PANEL with panel passed', () => {
      let action = actions.openPanel('a panel');
      expect(action).toEqual({type: types.OPEN_PANEL, panel: 'a panel'});
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

  describe('highlightReference()', () => {
    it('should return a HIGHLIGHT_REFERENCE with id', () => {
      let action = actions.highlightReference('id');
      expect(action).toEqual({type: types.HIGHLIGHT_REFERENCE, reference: 'id'});
    });
  });

  describe('activateReference()', () => {
    let dispatch;
    beforeEach(() => {
      spyOn(scroller, 'to');
      dispatch = jasmine.createSpy('dispatch');
    });

    it('should dispatch a ACTIVATE_REFERENCE with id', () => {
      actions.activateReference('id')(dispatch);
      expect(dispatch).toHaveBeenCalledWith({type: types.ACTIVE_REFERENCE, reference: 'id'});
      expect(dispatch).toHaveBeenCalledWith({type: types.OPEN_PANEL, panel: 'viewReferencesPanel'});
    });

    it('should scroll to the elements', () => {
      actions.activateReference('id')(dispatch);
      expect(scroller.to).toHaveBeenCalledWith('.document-viewer a[data-id="id"]', '.document-viewer');
      expect(scroller.to).toHaveBeenCalledWith('.document-references .item[data-id="id"]', '.document-references');
    });
  });

  describe('resetReferenceCreation()', () => {
    it('should RESET_REFERENCE_CREATION and unset targetDocument', () => {
      let dispatch = jasmine.createSpy('dispatch');
      actions.resetReferenceCreation()(dispatch);

      expect(dispatch).toHaveBeenCalledWith({type: types.RESET_REFERENCE_CREATION});
      expect(dispatch).toHaveBeenCalledWith({type: 'viewer/targetDoc/UNSET'});
      expect(dispatch).toHaveBeenCalledWith({type: 'viewer/targetDocHTML/UNSET'});
    });
  });
});
