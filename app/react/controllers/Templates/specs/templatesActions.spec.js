import * as actions from '../templatesActions';
import * as types from '../actionTypes';

describe('templatesActions', () => {
  beforeEach(() => {
    spyOn(Math, 'random').and.returnValue({
      toString() {
        return {
          substr() {
            return 'unique_id';
          }
        };
      }
    });
  });

  describe('addField()', () => {
    it('should return an ADD_FIELD type action with config, unique config.id and index passed', () => {
      let action = actions.addField({name: 'test'}, 'index !');
      expect(action).toEqual({type: types.ADD_FIELD, config: {name: 'test', id: 'unique_id'}, index: 'index !'});
    });

    it('should return default config object and index if nothing passed', () => {
      let action = actions.addField();
      expect(action).toEqual({type: types.ADD_FIELD, config: {id: 'unique_id'}, index: 0});
    });
  });

  describe('addPlaceholder()', () => {
    it('should return an ADD_PLACEHOLDER type action with config, unique config.id and index passed', () => {
      let index = 2;
      let action = actions.addPlaceholder(index);
      expect(action).toEqual({type: types.ADD_PLACEHOLDER, config: {id: 'unique_id', name: 'Placeholder'}, index: 2});
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
