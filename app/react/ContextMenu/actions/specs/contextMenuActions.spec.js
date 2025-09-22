import * as actions from '../../ContextMenu/actions/contextMenuActions.js';
import * as types from '../../ContextMenu/actions/actionTypes.js';

describe('contextMenuActions', () => {
  describe('openMenu()', () => {
    it('should return a OPEN_MENU type action', () => {
      const action = actions.openMenu();
      expect(action).toEqual({ type: types.OPEN_MENU });
    });
  });

  describe('closeMenu()', () => {
    it('should return a CLOSE_MENU type action', () => {
      const action = actions.closeMenu();
      expect(action).toEqual({ type: types.CLOSE_MENU });
    });
  });
});
