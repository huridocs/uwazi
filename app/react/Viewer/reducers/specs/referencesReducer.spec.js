import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';

import referencesReducer from 'app/Viewer/reducers/referencesReducer';
import * as types from 'app/Viewer/actions/actionTypes';

describe('Viewer referencesReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = referencesReducer();

      expect(newState).toBeImmutable();
      expect(newState.toJS()).toEqual([]);
    });
  });

  describe('SET_REFERENCES', () => {
    it('should set document passed', () => {
      let newState = referencesReducer(null, {type: types.SET_REFERENCES, references: [{title: 'test'}]});
      let expected = Immutable.fromJS([{title: 'test'}]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('ADD_CREATED_REFERENCE', () => {
    it('should should add reference passed', () => {
      let newState = referencesReducer(Immutable.fromJS([1]), {type: types.ADD_REFERENCE, reference: 2});
      let expected = Immutable.fromJS([1, 2]);

      expect(newState).toBeImmutable();
      expect(newState).toEqualImmutable(expected);
    });
  });

  describe('REMOVE_REFERENCE', () => {
    let initialState;

    beforeEach(() => {
      initialState = Immutable.fromJS([
        {_id: 'ref1', hub: 'hub1'},
        {_id: 'ref2', hub: 'hub1'},
        {_id: 'ref3', hub: 'hub2'},
        {_id: 'ref4', hub: 'hub2'},
        {_id: 'ref5', hub: 'hub2'}
      ]);
    });

    it('should remove the hub of the reference passed when hub has 2 or less items', () => {
      const action = {type: types.REMOVE_REFERENCE, reference: {_id: 'ref2', hub: 'hub1'}};
      const expectedState = [{_id: 'ref3', hub: 'hub2'}, {_id: 'ref4', hub: 'hub2'}, {_id: 'ref5', hub: 'hub2'}];
      expect(referencesReducer(initialState, action).toJS()).toEqual(expectedState);
    });

    it('should remove only the associated reference passed when hub has more than 2 items', () => {
      const action = {type: types.REMOVE_REFERENCE, reference: {_id: 'ref3', hub: 'hub2', associatedRelationship: {_id: 'ref4'}}};
      const expectedState = [
        {_id: 'ref1', hub: 'hub1'},
        {_id: 'ref2', hub: 'hub1'},
        {_id: 'ref3', hub: 'hub2'},
        {_id: 'ref5', hub: 'hub2'}
      ];

      expect(referencesReducer(initialState, action).toJS()).toEqual(expectedState);
    });
  });

  describe('RESET_DOCUMENT_VIEWER', () => {
    it('should reset to initialState', () => {
      let newState = referencesReducer(['reference'], {type: types.RESET_DOCUMENT_VIEWER});
      let expected = Immutable.fromJS([]);

      expect(newState).toBeImmutable();
      expect(newState.toJS()).toEqual(expected.toJS());
    });
  });
});
