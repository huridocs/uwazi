import * as actions from '../uiActions';
import * as types from '../actionTypes';

describe('uiActions', () => {
  describe('editProperty()', () => {
    it('should return an EDIT_PROPERTY action with the id', () => {
      let action = actions.editProperty('id');
      expect(action).toEqual({type: types.EDIT_PROPERTY, id: 'id'});
    });
  });
  describe('setThesauri()', () => {
    it('should return a SET_THESAURI action with the thesauri', () => {
      let action = actions.setThesauri('thesauri');
      expect(action).toEqual({type: types.SET_THESAURI, thesauri: 'thesauri'});
    });
  });
});
