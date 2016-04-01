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
    it('should set editingProperty to the action index', () => {
      let newState = reducer(Immutable.fromJS({}), {type: actions.EDIT_PROPERTY, index: 'test index'});
      expect(newState).toEqualImmutable(Immutable.fromJS({editingProperty: 'test index'}));
    });
  });
});
