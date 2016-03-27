import * as actions from '../templatesActions';
import * as types from '../actionTypes';

describe('templatesActions', () => {
  describe('addField()', () => {
    it('should return an ADD_FIELD type action with config  and index passed', () => {
      let action = actions.addField({name: 'test'}, 'index !');
      expect(action).toEqual({type: types.ADD_FIELD, config: {name: 'test'}, index: 'index !'});
    });

    it('should return default config object and index if nothing passed', () => {
      let action = actions.addField();
      expect(action).toEqual({type: types.ADD_FIELD, config: {}, index: 0});
    });
  });

  describe('removeField', () => {
    it('should return a REMOVE_FIELD type action with index passed', () => {
      let action = actions.removeField(55);
      expect(action).toEqual({type: types.REMOVE_FIELD, index: 55});
    });
  });

  describe('reorderProperty', () => {
    it('should return a REORDER_PROPERTY type action with origin and target indexes', () => {
      let action = actions.reorderProperty(1, 2);
      expect(action).toEqual({type: types.REORDER_PROPERTY, originIndex: 1, targetIndex: 2});
    });
  });
});
