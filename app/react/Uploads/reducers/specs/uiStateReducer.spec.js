import Immutable from 'immutable';
import * as types from 'app/Uploads/actions/actionTypes';

import uiReducer from 'app/Uploads/reducers/uiStateReducer';
import 'jasmine-immutablejs-matchers';

describe('uploads uiState reducer', () => {
  const initialState = Immutable.fromJS({});

  describe('when state is undefined', () => {
    it('should return default state', () => {
      let newState = uiReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('EDIT_METADATA', () => {
    it('should set the document if being edited on metadataBeingEdited', () => {
      let currentState = Immutable.fromJS({});
      let newState = uiReducer(currentState, {type: types.EDIT_METADATA, doc: {_id: 'doc2'}});
      expect(newState.get('metadataBeingEdited')).toEqual({_id: 'doc2'});
    });
  });

  describe('FINISH_EDIT_METADATA', () => {
    it('should unset the metadataBeingEdited', () => {
      let currentState = Immutable.fromJS({metadataBeingEdited: 'doc'});
      let newState = uiReducer(currentState, {type: types.FINISH_EDIT_METADATA});
      expect(newState).toEqualImmutable(Immutable.fromJS({}));
    });
  });
});
