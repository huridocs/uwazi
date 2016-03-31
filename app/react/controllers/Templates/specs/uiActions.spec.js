import * as actions from '../uiActions';
import * as types from '../actionTypes';

describe('uiActions', () => {
  describe('editProperty()', () => {
    it('should return an EDIT_PROPERTY action with the index', () => {
      let action = actions.editProperty('index');
      expect(action).toEqual({type: types.EDIT_PROPERTY, index: 'index'});
    });
  });
});
