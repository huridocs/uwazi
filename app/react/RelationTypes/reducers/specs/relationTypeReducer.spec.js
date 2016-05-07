import Immutable from 'immutable';
import * as actions from 'app/RelationTypes/actions/relationTypesActions';
import * as types from 'app/RelationTypes/actions/actionTypes';

import relationTypeReducer from 'app/RelationTypes/reducers/relationTypeReducer';
import 'jasmine-immutablejs-matchers';

describe('relationTypeReducer', () => {
  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = relationTypeReducer();
      expect(newState).toEqual(Immutable.fromJS({name: ''}));
    });
  });

  describe('EDIT_RELATION_TYPE', () => {
    it('should set the given relationType in the state to be edited', () => {
      let relationType = {name: 'Edit me!'};
      let newState = relationTypeReducer(null, actions.editRelationType(relationType));
      expect(newState).toEqual(Immutable.fromJS(relationType));
    });
  });

  describe('RESET_RELATION_TYPE', () => {
    it('should clear the data from the state', () => {
      let state = Immutable.fromJS({name: 'Edit me!'});
      let action = {type: types.RESET_RELATION_TYPE};
      let newState = relationTypeReducer(state, action);
      expect(newState).toEqual(Immutable.fromJS({name: ''}));
    });
  });
});
