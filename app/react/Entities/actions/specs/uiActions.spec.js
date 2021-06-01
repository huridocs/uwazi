import * as uiActions from '../uiActions';

describe('Entities uiActions', () => {
  describe('showTab', () => {
    it('should broadcast SHOW_TAB with values', () => {
      expect(uiActions.showTab('tab')).toEqual({ type: 'SHOW_TAB', tab: 'tab' });
    });
  });

  describe('resetUserSelectedTab', () => {
    it('should broadcast RESET_USER_SELECTED_TAB', () => {
      expect(uiActions.resetUserSelectedTab()).toEqual({ type: 'RESET_USER_SELECTED_TAB' });
    });
  });
});
