import Immutable from 'immutable';
import * as types from 'app/Uploads/actions/actionTypes';

import uiReducer from 'app/Uploads/reducers/uiStateReducer';
import 'jasmine-immutablejs-matchers';

describe('uploadsReducer', () => {
  const initialState = Immutable.fromJS({});

  describe('when state is undefined', () => {
    it('should return default state', () => {
      let newState = uiReducer();
      expect(newState).toEqual(initialState);
    });
  });

  describe('EDIT_UPLOADED_DOCUMENT', () => {
    it('should set the document if being edited on documentBeingEdited', () => {
      let currentState = Immutable.fromJS({});
      let newState = uiReducer(currentState, {type: types.EDIT_UPLOADED_DOCUMENT, doc: {_id: 'doc2'}});
      expect(newState).toEqualImmutable(Immutable.fromJS({documentBeingEdited: 'doc2'}));
    });
  });
});
