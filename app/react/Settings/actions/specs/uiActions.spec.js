import * as actions from '../uiActions';

describe('Settings/uiActions', () => {
  describe('editLink', () => {
    it('should return EDIT_LINK', () => {
      expect(actions.editLink('passed_id')).toEqual({type: 'EDIT_LINK', id: 'passed_id'});
    });
  });
});
