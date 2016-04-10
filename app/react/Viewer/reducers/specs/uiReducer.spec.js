import Immutable from 'immutable';
import 'jasmine-immutablejs-matchers';

import uiReducer from 'app/Viewer/reducers/uiReducer';
import * as types from 'app/Viewer/actions/actionTypes';

describe('documentReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state', () => {
      let newState = uiReducer();

      expect(newState).toBeImmutable();
      expect(newState.toJS()).toEqual({});
    });
  });

  describe('OPEN_REFERENCE_PANEL', () => {
    it('should set referencePanel = true', () => {
      let newState = uiReducer(Immutable.fromJS({}), {type: types.OPEN_REFERENCE_PANEL});
      let expected = Immutable.fromJS({referencePanel: true});

      expect(newState).toEqualImmutable(expected);
    });
  });
});
