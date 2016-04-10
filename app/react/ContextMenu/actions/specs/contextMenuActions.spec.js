import * as actions from 'app/ContextMenu/actions/contextMenuActions';
import * as types from 'app/ContextMenu/actions/actionTypes';

describe('contextMenuActions', () => {
  describe('openMenu()', () => {
    it('should return a OPEN_MENU type action', () => {
      let action = actions.openMenu();
      expect(action).toEqual({type: types.OPEN_MENU});
    });
  });

  describe('closeMenu()', () => {
    it('should return a CLOSE_MENU type action', () => {
      let action = actions.closeMenu();
      expect(action).toEqual({type: types.CLOSE_MENU});
    });
  });
});
