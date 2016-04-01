import Immutable from 'immutable';

import reducer from '~/Templates/reducers/uiReducer';
import * as actions from '~/Templates/actions/actionTypes';
import 'jasmine-immutablejs-matchers';

describe('fieldsReducer', () => {
  describe('when state is undefined', () => {
    it('return initial state {}', () => {
      let newState = reducer();
      expect(newState).toEqual(Immutable.fromJS({}));
    });
  });

  describe('EDIT_PROPERTY', () => {
    it('should set editingProperty to the action id', () => {
      let newState = reducer(Immutable.fromJS({}), {type: actions.EDIT_PROPERTY, id: 'test id'});
      expect(newState).toEqualImmutable(Immutable.fromJS({editingProperty: 'test id'}));
    });
  });
});
