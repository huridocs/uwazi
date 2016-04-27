import Immutable from 'immutable';
import * as types from 'app/Modals/actions/actionTypes';

import modalsReducer from 'app/Modals/reducers/modalsReducer';
import 'jasmine-immutablejs-matchers';

describe('modalsReducer', () => {
  const initialState = Immutable.fromJS({});

  describe('when state is undefined', () => {
    it('returns initial', () => {
      let newState = modalsReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('SHOW_MODAL', () => {
    it('should assign a key with modal name and data', () => {
      let newState = modalsReducer(initialState, {type: types.SHOW_MODAL, modal: 'modalName', data: 'data'});
      expect(newState.toJS().modalName).toEqual('data');
    });
  });

  describe('HIDE_MODAL', () => {
    it('should delete modal from the state', () => {
      let state = initialState.set('modalName', 1);
      let newState = modalsReducer(state, {type: types.HIDE_MODAL, modal: 'modalName'});
      expect(newState.toJS()).toEqual({});
    });
  });
});
