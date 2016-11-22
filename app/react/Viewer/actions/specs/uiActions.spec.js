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

  describe('deactivateReference', () => {
    it('should dispatch a DEACTIVATE_REFERENCE with id', () => {
      let action = actions.deactivateReference('id');
      expect(action).toEqual({type: types.DEACTIVATE_REFERENCE});
    });
  });

  describe('activateReference()', () => {
    let dispatch;
    beforeEach(() => {
      spyOn(scroller, 'to');
      spyOn(document, 'querySelector').and.returnValue(true);
      dispatch = jasmine.createSpy('dispatch');
    });

    it('should dispatch a ACTIVATE_REFERENCE with id', () => {
      actions.activateReference({_id: 'id'}, {})(dispatch);
      expect(dispatch).toHaveBeenCalledWith({type: types.ACTIVE_REFERENCE, reference: 'id'});
      expect(dispatch).toHaveBeenCalledWith({type: types.OPEN_PANEL, panel: 'viewMetadataPanel'});
    });

    it('should dispatch a SHOW_TAB references by default', () => {
      actions.activateReference({_id: 'id'}, {})(dispatch);
      expect(dispatch).toHaveBeenCalledWith({type: types.SHOW_TAB, tab: 'references'});
    });

    it('should dispatch a SHOW_TAB to a diferent tab if passed', () => {
      actions.activateReference({_id: 'id'}, {}, 'another tab')(dispatch);
      expect(dispatch).toHaveBeenCalledWith({type: types.SHOW_TAB, tab: 'another tab'});
    });

    it('should dispatch a SHOW_TAB references if Array is passed (when selecting a doc reference)', () => {
      actions.activateReference({_id: 'id'}, {}, [])(dispatch);
      expect(dispatch).toHaveBeenCalledWith({type: types.SHOW_TAB, tab: 'references'});
    });

    it('should scroll to the elements', (done) => {
      actions.activateReference({_id: 'id'}, {})(dispatch);
      setTimeout(() => {
        expect(scroller.to).toHaveBeenCalledWith('.document-viewer a[data-id="id"]', '.document-viewer', {duration: 100});
        expect(scroller.to).toHaveBeenCalledWith('.metadata-sidepanel .item[data-id="id"]', '.metadata-sidepanel .sidepanel-body', {duration: 100});
        done();
      });
    });
  });

  describe('selectReference()', () => {
    let dispatch;
    let references;

    beforeEach(() => {
      dispatch = jasmine.createSpy('dispatch');
      references = [{_id: 'id1'}, {_id: 'id2', range: 'range'}];
      actions.selectReference('id2', references, {})(dispatch);
      dispatch.calls.argsFor(0)[0](dispatch);
    });

    it('should dispatch a call to activateReference', () => {
      expect(dispatch).toHaveBeenCalledWith({type: types.ACTIVE_REFERENCE, reference: 'id2'});
      expect(dispatch).toHaveBeenCalledWith({type: types.OPEN_PANEL, panel: 'viewMetadataPanel'});
    });

    it('should dispatch a SET_TARGET_SELECTION with found range', () => {
      expect(dispatch).toHaveBeenCalledWith({type: types.SET_TARGET_SELECTION, targetRange: 'range'});
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
