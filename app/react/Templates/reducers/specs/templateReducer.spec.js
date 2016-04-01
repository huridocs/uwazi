import Immutable from 'immutable';

import templateReducer from '~/Templates/reducers/templateReducer';
import * as types from '~/Templates/actions/actionTypes';
import 'jasmine-immutablejs-matchers';

describe('templateReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state []', () => {
      let newState = templateReducer();

      expect(newState).toEqual(Immutable.fromJS({name: '', properties: []}));
    });
  });

  function testState() {
    return Immutable.fromJS({name: 'Template name', properties: [{name: '1'}, {name: '2'}]});
  }

  describe('ADD_PROPERTY', () => {
    it('should add a new field with the config passed on the index passed', () => {
      let newState = templateReducer(testState(), {type: types.ADD_PROPERTY, config: {name: 'test'}, index: 1});
      let expected = Immutable.fromJS({name: 'Template name', properties: [{name: '1'}, {name: 'test'}, {name: '2'}]});

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('UPDATE_PROPERTY', () => {
    it('should update the property in the correct index with the given config', () => {
      let newState = templateReducer(testState(), {type: types.UPDATE_PROPERTY, config: {newProp: 'newProp'}, index: 1});
      let expected = Immutable.fromJS({name: 'Template name', properties: [{name: '1'}, {name: '2', newProp: 'newProp'}]});

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('REMOVE_PROPERTY', () => {
    it('should delete the specified field', () => {
      let newState = templateReducer(testState(), {type: types.REMOVE_PROPERTY, index: 0});
      let expected = Immutable.fromJS({name: 'Template name', properties: [{name: '2'}]});

      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('REORDER_PROPERTY', () => {
    it('should reorder the property based on the origin/target index', () => {
      let newState = templateReducer(testState(), {type: types.REORDER_PROPERTY, originIndex: 1, targetIndex: 0});
      let expected = Immutable.fromJS({name: 'Template name', properties: [{name: '2'}, {name: '1'}]});

      expect(newState).toEqualImmutable(expected);
    });
  });
});
