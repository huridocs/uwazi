import * as actions from 'app/Viewer/actions/uiActions';
import * as types from 'app/Viewer/actions/actionTypes';

fdescribe('Viewer uiActions', () => {
  describe('setTemplates()', () => {
    it('should return a VIEWER_SET_TEMPLATES with templates', () => {
      let action = actions.setTemplates('templates');
      expect(action).toEqual({type: types.VIEWER_SET_TEMPLATES, templates: 'templates'});
    });
  });

  describe('setThesauris()', () => {
    it('should return a VIEWER_SET_THESAURIS with thesauris', () => {
      let action = actions.setThesauris('thesauris');
      expect(action).toEqual({type: types.VIEWER_SET_THESAURIS, thesauris: 'thesauris'});
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
