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

  describe('addProperty()', () => {
    it('should return an ADD_PROPERTY type action with config, unique config.id and index passed', () => {
      let action = actions.addProperty({name: 'test'}, 'index !');
      expect(action).toEqual({type: types.ADD_PROPERTY, config: {name: 'test', id: 'unique_id'}, index: 'index !'});
    });

    it('should return default config object and index if nothing passed', () => {
      let action = actions.addProperty();
      expect(action).toEqual({type: types.ADD_PROPERTY, config: {id: 'unique_id'}, index: 0});
    });
  });

  describe('updateProperty()', () => {
    it('should return an UPDATE_PROPERTY type action with the new property config', () => {
      let config = {name: 'super name'};
      let action = actions.updateProperty(config, 2);
      expect(action).toEqual({type: types.UPDATE_PROPERTY, config: {name: 'super name'}, index: 2});
    });
  });

  describe('selectProperty()', () => {
    it('should return an SELECT_PROPERTY type action with the property index', () => {
      let action = actions.selectProperty('property index');
      expect(action).toEqual({type: types.SELECT_PROPERTY, index: 'property index'});
    });
  });

  describe('removeProperty', () => {
    it('should return a REMOVE_FIELD type action with index passed', () => {
      let action = actions.removeProperty(55);
      expect(action).toEqual({type: types.REMOVE_PROPERTY, index: 55});
    });
  });

  describe('reorderProperty', () => {
    it('should return a REORDER_PROPERTY type action with origin and target indexes', () => {
      let action = actions.reorderProperty(1, 2);
      expect(action).toEqual({type: types.REORDER_PROPERTY, originIndex: 1, targetIndex: 2});
    });
  });

  describe('setTemplates', () => {
    it('should return a SET_TEMPLATES type with templates passed', () => {
      let templates = 'templates';
      let action = actions.setTemplates(templates);
      expect(action).toEqual({type: types.SET_TEMPLATES, templates: 'templates'});
    });
  });
});
