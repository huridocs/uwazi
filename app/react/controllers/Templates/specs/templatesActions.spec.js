import * as actions from '../templatesActions';
import * as types from '../actionTypes';

describe('templatesActions', () => {
  describe('addField()', () => {
    it('should return an ADD_FIELD type action with config passed', () => {
      let action = actions.addField({name: 'test'});
      expect(action).toEqual({type: types.ADD_FIELD, config: {name: 'test'}});
    });

    it('should return default config object if nothing passed', () => {
      let action = actions.addField();
      expect(action).toEqual({type: types.ADD_FIELD, config: {}});
    });
  });

  describe('removeField', () => {
    it('should return a REMOVE_FIELD type action with index passed', () => {
      let action = actions.removeField(55);
      expect(action).toEqual({type: types.REMOVE_FIELD, index: 55});
    });
  });
});
