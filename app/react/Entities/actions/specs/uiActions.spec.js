import * as uiActions from '../uiActions';

describe('Entities uiActions', () => {
  describe('showTab', () => {
    it('should broadcast SHOW_TAB with values', () => {
      expect(uiActions.showTab('tab')).toEqual({type: 'SHOW_TAB', tab: 'tab'});
    });
  });
});
