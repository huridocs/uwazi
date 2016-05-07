import Immutable from 'immutable';
import * as actions from 'app/RelationTypes/actions/relationTypesActions';
import * as types from 'app/RelationTypes/actions/actionTypes';

import relationTypesReducer from 'app/RelationTypes/reducers/relationTypesReducer';
import 'jasmine-immutablejs-matchers';

describe('relationTypeReducer', () => {
  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = relationTypesReducer();
      expect(newState).toEqualImmutable(Immutable.fromJS([]));
    });
  });

  describe('SET_RELATION_TYPES', () => {
    it('should set the given relationType in the state to be edited', () => {
      let relationTypes = [{name: 'Edit me!'}];
      let newState = relationTypesReducer([], actions.setRelationTypes(relationTypes));
      expect(newState).toEqualImmutable(Immutable.fromJS(relationTypes));
    });
  });

  describe('RELATION_TYPE_DELETED', () => {
    it('should remove it from the relationTypes list', () => {
      let state = Immutable.fromJS([{_id: 1, name: 'Edit me!'}, {_id: 2, name: 'Edit me!'}]);
      let action = {type: types.RELATION_TYPE_DELETED, id: 1};
      let newState = relationTypesReducer(state, action);
      expect(newState).toEqualImmutable(Immutable.fromJS([{_id: 2, name: 'Edit me!'}]));
    });
  });
});
