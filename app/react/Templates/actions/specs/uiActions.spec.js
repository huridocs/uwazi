import * as actions from '../uiActions';
import * as types from '../actionTypes';

describe('uiActions', () => {
  describe('editProperty()', () => {
    it('should return an EDIT_PROPERTY action with the id', () => {
      let action = actions.editProperty('id');
      expect(action).toEqual({type: types.EDIT_PROPERTY, id: 'id'});
    });
  });
});
